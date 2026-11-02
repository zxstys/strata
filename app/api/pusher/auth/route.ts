// app/api/pusher/auth/route.ts
import { db } from "@/lib/db/db";
import { isUuid } from "@/lib/comment/comment-query";
import { currentUser, isMember, unauthorized } from "@/lib/dm/dm-server";
import { pusher, STAFF_CHANNEL, userChannel } from "@/lib/dm/pusher-server";
import { isStaff } from "@/lib/user/roles";
import { supportTickets } from "@/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const CONV = "private-conv-";
const TICKET = "private-ticket-";

export async function POST(request: NextRequest) {
    const me = await currentUser();
    if (!me) return unauthorized();

    const form = await request.formData();
    const socketId = String(form.get("socket_id") ?? "");
    const channel = String(form.get("channel_name") ?? "");

    let allowed = false;

    if (channel === userChannel(me.id)) {
        allowed = true;
    } else if (channel === STAFF_CHANNEL) {
        allowed = isStaff(me.role);
    } else if (channel.startsWith(CONV)) {
        const id = channel.slice(CONV.length);
        allowed = isUuid(id) && (await isMember(id, me.id));
    } else if (channel.startsWith(TICKET)) {
        const id = channel.slice(TICKET.length);
        if (isUuid(id)) {
            const [ticket] = await db
                .select({ userId: supportTickets.userId })
                .from(supportTickets)
                .where(eq(supportTickets.uuid, id))
                .limit(1);
            if (ticket) allowed = isStaff(me.role) || ticket.userId === me.id;
        }
    }

    if (!allowed) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    return NextResponse.json(pusher.authorizeChannel(socketId, channel));
}