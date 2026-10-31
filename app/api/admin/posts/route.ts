// app/api/admin/posts/route.ts
import { forbidden, getAdminSession } from "@/lib/admin";
import { isUuid } from "@/lib/comment-query";
import { db } from "@/lib/db";
import { postQueryFields, toPost } from "@/lib/post-query";
import { posts, user } from "@/schema";
import { desc, eq, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const PAGE_SIZE = 20;
const escapeLike = (s: string) => s.replace(/[%_\\]/g, "\\$&");

export async function GET(request: NextRequest) {
    const admin = await getAdminSession();
    if (!admin) return forbidden();

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const page = Math.max(Number(request.nextUrl.searchParams.get("page")) || 1, 1);
    const pattern = `%${escapeLike(q)}%`;

    const where = q
        ? or(ilike(posts.content, pattern), ilike(user.username, pattern))
        : undefined;

    const rows = await db
        .select(postQueryFields(admin.id))
        .from(posts)
        .innerJoin(user, eq(posts.userId, user.id))
        .where(where)
        .orderBy(desc(posts.createdAt))
        .limit(PAGE_SIZE + 1)
        .offset((page - 1) * PAGE_SIZE);

    return NextResponse.json(
        { posts: rows.slice(0, PAGE_SIZE).map(toPost), hasMore: rows.length > PAGE_SIZE },
        { status: 200 }
    );
}

export async function DELETE(request: NextRequest) {
    const admin = await getAdminSession();
    if (!admin) return forbidden();

    const { uuid } = await request.json();
    if (!isUuid(uuid)) {
        return NextResponse.json({ message: "Invalid post id." }, { status: 400 });
    }

    // Likes and replies are removed by the cascade on the foreign keys.
    const deleted = await db
        .delete(posts)
        .where(eq(posts.uuid, uuid))
        .returning({ uuid: posts.uuid });

    if (deleted.length === 0) {
        return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "ok" }, { status: 200 });
}