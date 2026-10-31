// app/api/admin/stats/route.ts
import { forbidden, getAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { comments, postLikes, posts, user } from "@/schema";
import { count, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        if (!(await getAdminSession())) return forbidden();

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            users,
            admins,
            verified,
            goldPermitted,
            totalPosts,
            postsToday,
            replies,
            likes,
        ] = await Promise.all([
            db.select({ n: count() }).from(user),
            db.select({ n: count() }).from(user).where(eq(user.role, "admin")),
            db.select({ n: count() }).from(user).where(eq(user.verified, true)),
            db.select({ n: count() }).from(user).where(eq(user.goldPermission, true)),
            db.select({ n: count() }).from(posts),
            db.select({ n: count() }).from(posts).where(gt(posts.createdAt, since)),
            db.select({ n: count() }).from(comments),
            db.select({ n: count() }).from(postLikes),
        ]);

        return NextResponse.json(
            {
                users: users[0].n,
                admins: admins[0].n,
                verified: verified[0].n,
                goldPermitted: goldPermitted[0].n,
                posts: totalPosts[0].n,
                postsToday: postsToday[0].n,
                comments: replies[0].n,
                likes: likes[0].n,
            },
            { status: 200 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Stats failed.";
        console.error("[admin/stats]", message);
        return NextResponse.json({ message }, { status: 500 });
    }
}