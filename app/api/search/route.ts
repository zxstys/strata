// app/api/search/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { postQueryFields, toPost } from "@/lib/post-query";
import { posts, user } from "@/schema";
import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const escapeLike = (s: string) => s.replace(/[%_\\]/g, "\\$&");

export async function GET(request: NextRequest) {
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);

    if (!q) {
        return NextResponse.json({ users: [], posts: [] }, { status: 200 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const viewerId = session?.user?.id ?? null;
    const pattern = `%${escapeLike(q)}%`;

    const [userRows, postRows] = await Promise.all([
        db
            .select({
                id: user.id,
                name: user.name,
                username: user.username,
                image: user.image,
                verified: user.verified,
                gold: sql<boolean>`(${user.goldPermission} and ${user.goldEnabled})`,
            })
            .from(user)
            .where(or(ilike(user.name, pattern), ilike(user.username, pattern)))
            .orderBy(asc(user.name))
            .limit(8),

        db
            .select(postQueryFields(viewerId))
            .from(posts)
            .innerJoin(user, eq(posts.userId, user.id))
            .where(ilike(posts.content, pattern))
            .orderBy(desc(posts.createdAt))
            .limit(15),
    ]);

    return NextResponse.json(
        {
            users: userRows.map((r) => ({
                ...r,
                image: r.image ?? null,
                gold: Boolean(r.gold),
            })),
            posts: postRows.map(toPost),
        },
        { status: 200 }
    );
}