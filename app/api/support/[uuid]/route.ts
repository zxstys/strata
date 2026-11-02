// app/api/support/[uuid]/route.ts
import { isUuid } from "@/lib/comment/comment-query";
import { db } from "@/lib/db/db";
import { currentUser, unauthorized } from "@/lib/dm/dm-server";
import { push, STAFF_CHANNEL, ticketChannel, userChannel } from "@/lib/dm/pusher-server";
import { loadThread, toThreadMessage } from "@/lib/support/support-thread";
import { isStaff } from "@/lib/user/roles";
import { supportMessages, supportTickets } from "@/schema";
import { and, count, eq, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ uuid: string }> };

const MAX_CHARS = 2000;
const HOUR_MS = 60 * 60 * 1000;
const HOURLY_LIMIT = 60;
const CLOSED = ["resolved", "rejected"];

const bad = (message: string) => NextResponse.json({ message }, { status: 400 });
const notFound = () => NextResponse.json({ message: "Not found." }, { status: 404 });

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { uuid } = await params;
    const me = await currentUser();
    if (!me) return unauthorized();
    if (!isUuid(uuid)) return bad("Invalid id.");

    const result = await loadThread(uuid, me);
    if ("error" in result) return notFound();

    return NextResponse.json(result, { status: 200 });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const { uuid } = await params;
    const me = await currentUser();
    if (!me) return unauthorized();
    if (!isUuid(uuid)) return bad("Invalid id.");

    const body = await request.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) return bad("Write a message first.");
    if (content.length > MAX_CHARS) {
        return bad(`Messages are limited to ${MAX_CHARS} characters.`);
    }

    const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.uuid, uuid))
        .limit(1);
    if (!ticket) return notFound();

    const isOwner = ticket.userId === me.id;
    const staffReply = isStaff(me.role) && !isOwner;
    if (!staffReply && !isOwner) return notFound();

    const [recent] = await db
        .select({ n: count() })
        .from(supportMessages)
        .where(
            and(
                eq(supportMessages.senderId, me.id),
                gt(supportMessages.createdAt, new Date(Date.now() - HOUR_MS))
            )
        );
    if ((recent?.n ?? 0) >= HOURLY_LIMIT) {
        return NextResponse.json(
            { message: "You're sending messages too fast. Try again later." },
            { status: 429 }
        );
    }

    const [saved] = await db
        .insert(supportMessages)
        .values({ ticketUuid: uuid, senderId: me.id, isStaff: staffReply, content })
        .returning();

    // Staff reply: open -> in progress. User reply: a closed request reopens.
    let status = ticket.status;
    if (staffReply && ticket.status === "open") status = "in_progress";
    if (!staffReply && CLOSED.includes(ticket.status)) status = "open";

    await db
        .update(supportTickets)
        .set({
            status,
            updatedAt: new Date(),
            ...(staffReply ? { handledBy: me.id } : {}),
        })
        .where(eq(supportTickets.uuid, uuid));

    const payload = toThreadMessage(saved);

    await push(ticketChannel(uuid), "message", payload);
    if (staffReply && ticket.userId) {
        await push(userChannel(ticket.userId), "support", { uuid });
    }
    if (!staffReply) {
        await push(STAFF_CHANNEL, "ticket", { uuid });
    }

    return NextResponse.json(payload, { status: 201 });
}