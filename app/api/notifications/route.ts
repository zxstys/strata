// app/api/notifications/route.ts
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { comments, notifications, posts, user } from "@/schema";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const PREVIEW_MAX = 140;

async function currentUserId() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
}

export async function GET() {
    const me = await currentUserId();
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const actor = alias(user, "actor");

    const rows = await db
        .select({
            id: notifications.id,
            kind: notifications.kind,
            postUuid: notifications.postUuid,
            commentUuid: notifications.commentUuid,
            readAt: notifications.readAt,
            createdAt: notifications.createdAt,
            actorId: actor.id,
            actorName: actor.name,
            actorUsername: actor.username,
            actorImage: actor.image,
            actorVerified: actor.verified,
            actorGold: sql<boolean>`(${actor.goldPermission} and ${actor.goldEnabled})`,
            actorMod: sql<boolean>`(${actor.role} = 'mod')`,
            preview: sql<string>`coalesce(${comments.content}, ${posts.content})`,
        })
        .from(notifications)
        .innerJoin(actor, eq(actor.id, notifications.actorId))
        .leftJoin(posts, eq(posts.uuid, notifications.postUuid))
        .leftJoin(comments, eq(comments.uuid, notifications.commentUuid))
        .where(eq(notifications.userId, me))
        .orderBy(desc(notifications.createdAt))
        .limit(30);

    const [unread] = await db
        .select({ n: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, me), isNull(notifications.readAt)));

    return NextResponse.json(
        {
            items: rows.map((r) => ({
                id: r.id,
                kind: r.kind,
                postUuid: r.postUuid,
                commentUuid: r.commentUuid,
                readAt: r.readAt?.toISOString() ?? null,
                createdAt: r.createdAt.toISOString(),
                preview: (r.preview ?? "").slice(0, PREVIEW_MAX),
                actor: {
                    id: r.actorId,
                    name: r.actorName,
                    username: r.actorUsername,
                    image: r.actorImage ?? null,
                    verified: r.actorVerified,
                    gold: Boolean(r.actorGold),
                    mod: Boolean(r.actorMod),
                },
            })),
            unread: Number(unread?.n ?? 0),
        },
        { status: 200 }
    );
}

export async function POST() {
    const me = await currentUserId();
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.userId, me), isNull(notifications.readAt)));

    return NextResponse.json({ message: "ok" }, { status: 200 });
}