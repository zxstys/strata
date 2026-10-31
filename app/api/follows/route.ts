// app/api/follows/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { follows, user } from "@/schema";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const badRequest = (message: string) =>
    NextResponse.json({ message }, { status: 400 });
const notFound = (message: string) =>
    NextResponse.json({ message }, { status: 404 });

// Accepts a username or a user id, like the profile route.
async function resolveUserId(key: string) {
    const [row] = await db
        .select({ id: user.id })
        .from(user)
        .where(or(eq(user.username, key.toLowerCase()), eq(user.id, key)))
        .limit(1);
    return row?.id ?? null;
}

// GET /api/follows?user=<username|id>&type=followers|following
export async function GET(request: NextRequest) {
    const key = request.nextUrl.searchParams.get("user")?.trim() ?? "";
    const type = request.nextUrl.searchParams.get("type");

    if (!key) return badRequest("user is required.");
    if (type !== "followers" && type !== "following") {
        return badRequest("type must be followers or following.");
    }

    const targetId = await resolveUserId(key);
    if (!targetId) return notFound("User not found.");

    const isFollowers = type === "followers";

    const rows = await db
        .select({
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
            verified: user.verified,
            gold: sql<boolean>`(${user.goldPermission} and ${user.goldEnabled})`,
        })
        .from(follows)
        .innerJoin(
            user,
            eq(isFollowers ? follows.followerId : follows.followingId, user.id)
        )
        .where(eq(isFollowers ? follows.followingId : follows.followerId, targetId))
        .orderBy(desc(follows.createdAt))
        .limit(100);

    return NextResponse.json(
        rows.map((r) => ({ ...r, image: r.image ?? null })),
        { status: 200 }
    );
}

// POST /api/follows  { userId, follow: boolean }
export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    const me = session?.user?.id ?? null;
    if (!me) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId, follow } = await request.json();
    if (typeof userId !== "string" || typeof follow !== "boolean") {
        return badRequest("Invalid request.");
    }
    if (userId === me) return badRequest("You can't follow yourself.");

    const [target] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
    if (!target) return notFound("User not found.");

    if (follow) {
        await db
            .insert(follows)
            .values({ followerId: me, followingId: userId })
            .onConflictDoNothing();
    } else {
        await db
            .delete(follows)
            .where(and(eq(follows.followerId, me), eq(follows.followingId, userId)));
    }

    return NextResponse.json({ following: follow }, { status: 200 });
}