// app/api/support/queue/route.ts
import { forbidden, getStaffSession } from "@/lib/admin/admin";
import { isUuid } from "@/lib/comment/comment-query";
import { db } from "@/lib/db/db";
import { isAdmin } from "@/lib/user/roles";
import {
    isTicketStatus,
    isTicketType,
    OPEN_STATUSES,
    TYPE_INFO,
    type TicketStatus,
    type TicketType,
} from "@/lib/support/support";
import { supportTickets, user } from "@/schema";
import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const bad = (message: string) => NextResponse.json({ message }, { status: 400 });

export async function GET(request: NextRequest) {
    const staff = await getStaffSession();
    if (!staff) return forbidden();

    const filter = request.nextUrl.searchParams.get("status");
    const where =
        filter === "all"
            ? undefined
            : filter && isTicketStatus(filter)
                ? eq(supportTickets.status, filter)
                : inArray(supportTickets.status, OPEN_STATUSES);

    const rows = await db
        .select({
            uuid: supportTickets.uuid,
            type: supportTickets.type,
            subject: supportTickets.subject,
            message: supportTickets.message,
            status: supportTickets.status,
            adminNote: supportTickets.adminNote,
            contactEmail: supportTickets.contactEmail,
            createdAt: supportTickets.createdAt,
            userId: user.id,
            userName: user.name,
            userUsername: user.username,
            userEmail: user.email,
            userImage: user.image,
            verified: user.verified,
            goldPermission: user.goldPermission,
            goldEnabled: user.goldEnabled,
            role: user.role,
        })
        .from(supportTickets)
        .leftJoin(user, eq(supportTickets.userId, user.id))
        .where(where)
        .orderBy(asc(supportTickets.createdAt))
        .limit(100);

    return NextResponse.json(
        rows.map((r) => ({
            uuid: r.uuid,
            type: r.type as TicketType,
            subject: r.subject,
            message: r.message,
            status: r.status as TicketStatus,
            adminNote: r.adminNote,
            contactEmail: r.contactEmail,
            createdAt: r.createdAt.toISOString(),
            user: r.userId
                ? {
                    id: r.userId,
                    name: r.userName ?? "",
                    username: r.userUsername,
                    email: r.userEmail ?? "",
                    image: r.userImage,
                    verified: Boolean(r.verified),
                    goldPermission: Boolean(r.goldPermission),
                    goldEnabled: Boolean(r.goldEnabled),
                    role: r.role,
                }
                : null,
        })),
        { status: 200 }
    );
}

// Applies the access a request asks for. Only called for admins.
async function grantAccess(type: TicketType, userId: string) {
    if (type === "verification") {
        await db.update(user).set({ verified: true }).where(eq(user.id, userId));
    }
    if (type === "gold") {
        await db.update(user).set({ goldPermission: true }).where(eq(user.id, userId));
    }
    if (type === "mod") {
        // Never downgrade an admin to moderator.
        await db
            .update(user)
            .set({ role: "mod" })
            .where(
                and(eq(user.id, userId), or(isNull(user.role), eq(user.role, "user")))
            );
    }
}

export async function PATCH(request: NextRequest) {
    const staff = await getStaffSession();
    if (!staff) return forbidden();

    const body = await request.json().catch(() => null);
    const uuid = body?.uuid;
    if (!isUuid(uuid)) return bad("Invalid ticket id.");

    const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.uuid, uuid))
        .limit(1);

    if (!ticket) {
        return NextResponse.json({ message: "Ticket not found." }, { status: 404 });
    }

    const status: TicketStatus =
        body.status === undefined ? (ticket.status as TicketStatus) : body.status;
    if (!isTicketStatus(status)) return bad("Invalid status.");

    const adminNote =
        typeof body.adminNote === "string"
            ? body.adminNote.trim().slice(0, 1000) || null
            : ticket.adminNote;

    if (body.grant === true) {
        if (!isAdmin(staff.role)) return forbidden();
        if (!isTicketType(ticket.type) || !TYPE_INFO[ticket.type].grantLabel) {
            return bad("This request type can't be granted automatically.");
        }
        if (!ticket.userId) return bad("This request isn't linked to an account.");
        if (status !== "resolved") return bad("Set the status to resolved to grant access.");

        await grantAccess(ticket.type, ticket.userId);
    }

    await db
        .update(supportTickets)
        .set({ status, adminNote, handledBy: staff.id, updatedAt: new Date() })
        .where(eq(supportTickets.uuid, uuid));

    return NextResponse.json({ message: "ok" }, { status: 200 });
}