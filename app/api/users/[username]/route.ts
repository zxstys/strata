import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { postQueryFields, toPost } from "@/lib/post/post-query";
import { isModSql } from "@/lib/db/user-sql";
import { follows, posts, user } from "@/schema";
import { desc, eq, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    const viewerId = session?.user?.id ?? null;

    const [profile] = await db
        .select({
            id: user.id,
            name: user.name,
            username: user.username,
            about: user.about,
            image: user.image,
            banner: user.banner,
            verified: user.verified,
            gold: sql<boolean>`(${user.goldPermission} and ${user.goldEnabled})`,
            mod: isModSql,
            createdAt: user.createdAt,
            followers: sql<number>`(select count(*)::int from ${follows} where ${follows.followingId} = ${user.id})`,
            following: sql<number>`(select count(*)::int from ${follows} where ${follows.followerId} = ${user.id})`,
            isFollowing: viewerId
                ? sql<boolean>`exists (
            select 1 from ${follows}
            where ${follows.followerId} = ${viewerId}
            and ${follows.followingId} = ${user.id}
          )`
                : sql<boolean>`false`,
        })
        .from(user)
        .where(
            or(eq(user.username, username.toLowerCase()), eq(user.id, username))
        )
        .limit(1);

    if (!profile) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const rows = await db
        .select(postQueryFields(viewerId))
        .from(posts)
        .innerJoin(user, eq(posts.userId, user.id))
        .where(eq(posts.userId, profile.id))
        .orderBy(sql`${posts.pinnedAt} desc nulls last`, desc(posts.createdAt))
        .limit(50);

    return NextResponse.json(
        {
            user: {
                id: profile.id,
                name: profile.name,
                username: profile.username,
                about: profile.about,
                image: profile.image ?? null,
                banner: profile.banner ?? null,
                verified: profile.verified,
                gold: profile.gold,
                mod: Boolean(profile.mod),
                createdAt: profile.createdAt.toISOString(),
                isOwner: viewerId === profile.id,
                followers: Number(profile.followers) || 0,
                following: Number(profile.following) || 0,
                isFollowing: Boolean(profile.isFollowing),
            },
            posts: rows.map(toPost),
        },
        { status: 200 }
    );
}