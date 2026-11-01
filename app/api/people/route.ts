import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { isModSql } from "@/lib/db/user-sql";
import { follows, user } from "@/schema";
import { desc, ne, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth.api.getSession({ headers: await headers() });
    const viewerId = session?.user?.id ?? null;

    const rows = await db
        .select({
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
            verified: user.verified,
            gold: sql<boolean>`(${user.goldPermission} and ${user.goldEnabled})`,
            mod: isModSql,
            isFollowing: viewerId
                ? sql<boolean>`exists (
            select 1 from ${follows}
            where ${follows.followerId} = ${viewerId}
            and ${follows.followingId} = ${user.id}
          )`
                : sql<boolean>`false`,
        })
        .from(user)
        .where(viewerId ? ne(user.id, viewerId) : undefined)
        .orderBy(desc(user.createdAt))
        .limit(12);

    return NextResponse.json(
        rows.map((r) => ({
            ...r,
            image: r.image ?? null,
            gold: Boolean(r.gold),
            mod: Boolean(r.mod),
            isFollowing: Boolean(r.isFollowing),
        })),
        { status: 200 }
    );
}