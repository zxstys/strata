// lib/support/support-thread.ts
import { db } from "@/lib/db/db";
import { isStaff } from "@/lib/user/roles";
import { supportMessages, supportTickets } from "@/schema";
import { asc, eq } from "drizzle-orm";

type Viewer = { id: string; role?: string | null };

export type ThreadMessage = {
    id: string;
    content: string;
    isStaff: boolean;
    senderId: string | null;
    createdAt: string;
};

export const toThreadMessage = (m: {
    id: string;
    content: string;
    isStaff: boolean;
    senderId: string | null;
    createdAt: Date;
}): ThreadMessage => ({
    id: m.id,
    content: m.content,
    isStaff: m.isStaff,
    senderId: m.senderId,
    createdAt: m.createdAt.toISOString(),
});

// Staff can open any ticket. Users can open only their own.
// Missing and forbidden both return "not_found" so ticket ids can't be probed.
export async function loadThread(uuid: string, viewer: Viewer) {
    const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.uuid, uuid))
        .limit(1);

    if (!ticket) return { error: "not_found" as const };
    if (!isStaff(viewer.role) && ticket.userId !== viewer.id) {
        return { error: "not_found" as const };
    }

    const rows = await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.ticketUuid, uuid))
        .orderBy(asc(supportMessages.createdAt))
        .limit(200);

    const opener: ThreadMessage = {
        id: `opener-${ticket.uuid}`,
        content: ticket.message,
        isStaff: false,
        senderId: ticket.userId,
        createdAt: ticket.createdAt.toISOString(),
    };

    return {
        ticket: {
            uuid: ticket.uuid,
            type: ticket.type,
            subject: ticket.subject,
            status: ticket.status,
            adminNote: ticket.adminNote,
            createdAt: ticket.createdAt.toISOString(),
            ownerId: ticket.userId,
        },
        messages: [opener, ...rows.map(toThreadMessage)],
    };
}