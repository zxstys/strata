// app/api/support/route.ts
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { push, STAFF_CHANNEL } from "@/lib/dm/pusher-server";
import {
    isTicketType,
    OPEN_STATUSES,
    TYPE_INFO,
    type TicketType,
} from "@/lib/support/support";
import { supportTickets } from "@/schema";
import { and, count, desc, eq, gt, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY_MS = 86_400_000;
const DAILY_LIMIT = 5;

const bad = (message: string) => NextResponse.json({ message }, { status: 400 });

// The signed-in user's own requests.
export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
        .select({
            uuid: supportTickets.uuid,
            type: supportTickets.type,
            subject: supportTickets.subject,
            status: supportTickets.status,
            adminNote: supportTickets.adminNote,
            createdAt: supportTickets.createdAt,
        })
        .from(supportTickets)
        .where(eq(supportTickets.userId, session.user.id))
        .orderBy(desc(supportTickets.createdAt))
        .limit(50);

    return NextResponse.json(
        rows.map((r) => ({
            ...r,
            type: r.type as TicketType,
            createdAt: r.createdAt.toISOString(),
        })),
        { status: 200 }
    );
}

export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    const me = session?.user ?? null;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return bad("Invalid request.");

    const type = body.type;
    if (!isTicketType(type)) return bad("Choose a request type.");

    if (!me && TYPE_INFO[type].signedInOnly) {
        return NextResponse.json(
            { message: "Sign in to submit this request." },
            { status: 401 }
        );
    }

    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const email =
        typeof body.contactEmail === "string" ? body.contactEmail.trim().toLowerCase() : "";

    if (subject.length < 3 || subject.length > 120) {
        return bad("Subject must be 3 to 120 characters.");
    }
    if (message.length < 10 || message.length > 2000) {
        return bad("Message must be 10 to 2,000 characters.");
    }
    if (!me && !EMAIL_RE.test(email)) {
        return bad("Enter an email address we can reply to.");
    }

    // Signed-in users are matched by account, signed-out users by email.
    const identity = me
        ? eq(supportTickets.userId, me.id)
        : eq(supportTickets.contactEmail, email);

    const [duplicate] = await db
        .select({ uuid: supportTickets.uuid })
        .from(supportTickets)
        .where(
            and(
                identity,
                eq(supportTickets.type, type),
                inArray(supportTickets.status, OPEN_STATUSES)
            )
        )
        .limit(1);

    if (duplicate) {
        return NextResponse.json(
            { message: "You already have an open request of this type." },
            { status: 409 }
        );
    }

    const [recent] = await db
        .select({ n: count() })
        .from(supportTickets)
        .where(and(identity, gt(supportTickets.createdAt, new Date(Date.now() - DAY_MS))));

    if ((recent?.n ?? 0) >= DAILY_LIMIT) {
        return NextResponse.json(
            { message: "Too many requests today. Try again tomorrow." },
            { status: 429 }
        );
    }

    const [created] = await db
        .insert(supportTickets)
        .values({
            userId: me?.id ?? null,
            contactEmail: me ? null : email,
            type,
            subject,
            message,
        })
        .returning({ uuid: supportTickets.uuid });

    await push(STAFF_CHANNEL, "ticket", { uuid: created.uuid });

    return NextResponse.json({ uuid: created.uuid }, { status: 201 });
}