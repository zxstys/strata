// app/api/posts/[...all]/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { commentQueryFields, isUuid, toComment } from "@/lib/comment-query";
import { isBlobUrl, isGifUrl } from "@/lib/media";
import { postQueryFields, toPost } from "@/lib/post-query";
import { checkPostText, FREE_POST_LIMIT } from "@/lib/post-rules";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { comments, postLikes, posts, user } from "@/schema";

type RouteParams = {
    params: Promise<{ all: string[] }>;
};

async function canExceedPostLimit(userId: string) {
    const [row] = await db
        .select({
            verified: user.verified,
            goldPermission: user.goldPermission,
            goldEnabled: user.goldEnabled,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    return Boolean(row && (row.verified || (row.goldPermission && row.goldEnabled)));
}

async function postLimitFor(userId: string) {
    return (await canExceedPostLimit(userId)) ? null : FREE_POST_LIMIT;
}

const unauthorized = () =>
    NextResponse.json({ message: "Unauthorized" }, { status: 401 });
const badRequest = (message: string) =>
    NextResponse.json({ message }, { status: 400 });
const notFound = (message: string) =>
    NextResponse.json({ message }, { status: 404 });

export async function GET(request: NextRequest, { params }: RouteParams) {
    const { all } = await params;
    const action = all[0];
    const page = Number(all[1]) || 0;

    const session = await auth.api.getSession({ headers: await headers() });
    const viewerId = session?.user?.id ?? null;

    switch (action) {
        case "all": {
            const offset = (Math.max(page, 1) - 1) * 20;

            const rows = await db
                .select(postQueryFields(viewerId))
                .from(posts)
                .innerJoin(user, eq(posts.userId, user.id))
                .orderBy(desc(posts.createdAt))
                .limit(20)
                .offset(offset);

            return NextResponse.json(rows.map(toPost), { status: 200 });
        }

        case "one": {
            const postUuid = all[1];
            if (!isUuid(postUuid)) return badRequest("Invalid post id");

            const [row] = await db
                .select(postQueryFields(viewerId))
                .from(posts)
                .innerJoin(user, eq(posts.userId, user.id))
                .where(eq(posts.uuid, postUuid))
                .limit(1);

            if (!row) return notFound("Post not found");
            return NextResponse.json(toPost(row), { status: 200 });
        }

        case "comments": {
            const postUuid = all[1];
            if (!isUuid(postUuid)) return badRequest("Invalid post id");

            const rows = await db
                .select(commentQueryFields(viewerId))
                .from(comments)
                .innerJoin(user, eq(comments.userId, user.id))
                .where(eq(comments.postUuid, postUuid))
                .orderBy(asc(comments.createdAt))
                .limit(100);

            return NextResponse.json(rows.map(toComment), { status: 200 });
        }

        default:
            return notFound("Not found");
    }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    const { all } = await params;
    const action = all[0];
    const session = await auth.api.getSession({ headers: await headers() });
    const me = session?.user?.id ?? null;

    switch (action) {
        case "create": {
            if (!me) return unauthorized();

            const { content, mediaUrl } = await request.json();
            const text = typeof content === "string" ? content.trim() : "";

            if (mediaUrl != null && !isBlobUrl(mediaUrl)) {
                return badRequest("Invalid attachment.");
            }

            const problem = checkPostText(text, await postLimitFor(me));
            if (problem) return badRequest(problem);
            if (!text && !mediaUrl) return badRequest("Write something or attach an image.");

            const [created] = await db
                .insert(posts)
                .values({ content: text, mediaUrl: mediaUrl ?? null, userId: me })
                .returning({ uuid: posts.uuid });

            return NextResponse.json({ message: "ok", uuid: created.uuid }, { status: 201 });
        }

        case "edit": {
            if (!me) return unauthorized();

            const { uuid, content } = await request.json();
            if (!isUuid(uuid)) return badRequest("Invalid post id.");

            const text = typeof content === "string" ? content.trim() : "";

            // Only the author can edit. Matching on userId covers both checks.
            const [post] = await db
                .select({ mediaUrl: posts.mediaUrl })
                .from(posts)
                .where(and(eq(posts.uuid, uuid), eq(posts.userId, me)))
                .limit(1);

            if (!post) return notFound("Post not found or not yours.");
            if (!text && !post.mediaUrl) return badRequest("Write something before saving.");

            const problem = checkPostText(text, await postLimitFor(me));
            if (problem) return badRequest(problem);

            // createdAt is untouched, so the post keeps its place in the timeline.
            await db
                .update(posts)
                .set({ content: text, editedAt: new Date() })
                .where(and(eq(posts.uuid, uuid), eq(posts.userId, me)));

            return NextResponse.json({ message: "ok" }, { status: 200 });
        }

        case "delete": {
            if (!me) return unauthorized();

            const { uuid } = await request.json();
            if (!isUuid(uuid)) return badRequest("Invalid post id.");

            // Likes and replies are removed by the cascade on the foreign keys.
            const deleted = await db
                .delete(posts)
                .where(and(eq(posts.uuid, uuid), eq(posts.userId, me)))
                .returning({ uuid: posts.uuid });

            if (deleted.length === 0) return notFound("Post not found or not yours.");
            return NextResponse.json({ message: "ok" }, { status: 200 });
        }

        case "pin": {
            if (!me) return unauthorized();

            const { uuid, pinned } = await request.json();
            if (!isUuid(uuid) || typeof pinned !== "boolean") {
                return badRequest("Invalid request.");
            }

            // Verify ownership first, so this user can't clear pins on posts they don't own.
            const [post] = await db
                .select({ uuid: posts.uuid })
                .from(posts)
                .where(and(eq(posts.uuid, uuid), eq(posts.userId, me)))
                .limit(1);

            if (!post) return notFound("Post not found or not yours.");

            if (pinned) {
                // One statement: pins this post and clears any other pin by the same user.
                await db
                    .update(posts)
                    .set({
                        pinnedAt: sql`case when ${posts.uuid} = ${uuid}::uuid then now() else null end`,
                    })
                    .where(
                        and(
                            eq(posts.userId, me),
                            or(eq(posts.uuid, uuid), isNotNull(posts.pinnedAt))
                        )
                    );
            } else {
                await db
                    .update(posts)
                    .set({ pinnedAt: null })
                    .where(and(eq(posts.uuid, uuid), eq(posts.userId, me)));
            }

            return NextResponse.json({ message: "ok" }, { status: 200 });
        }

        case "comment": {
            if (!me) return unauthorized();

            const { postUuid, content, mediaUrl } = await request.json();
            const text = typeof content === "string" ? content.trim() : "";

            if (!isUuid(postUuid)) return badRequest("Invalid post id");
            if (text.length > 500) return badRequest("Replies are limited to 500 characters.");
            if (mediaUrl != null && (!isBlobUrl(mediaUrl) || !isGifUrl(mediaUrl))) {
                return badRequest("Only GIF attachments are allowed on replies.");
            }
            if (!text && !mediaUrl) return badRequest("Write something or add a GIF.");

            const [post] = await db
                .select({ uuid: posts.uuid })
                .from(posts)
                .where(eq(posts.uuid, postUuid))
                .limit(1);

            if (!post) return notFound("Post not found.");

            const [created] = await db
                .insert(comments)
                .values({ postUuid, userId: me, content: text, mediaUrl: mediaUrl ?? null })
                .returning({ uuid: comments.uuid });

            const [row] = await db
                .select(commentQueryFields(me))
                .from(comments)
                .innerJoin(user, eq(comments.userId, user.id))
                .where(eq(comments.uuid, created.uuid))
                .limit(1);

            return NextResponse.json(toComment(row), { status: 201 });
        }

        case "comment-delete": {
            if (!me) return unauthorized();

            const { uuid } = await request.json();
            if (!isUuid(uuid)) return badRequest("Invalid comment id");

            const deleted = await db
                .delete(comments)
                .where(and(eq(comments.uuid, uuid), eq(comments.userId, me)))
                .returning({ uuid: comments.uuid });

            if (deleted.length === 0) return notFound("Comment not found or not yours.");
            return NextResponse.json({ message: "ok" }, { status: 200 });
        }

        case "like": {
            if (!me) return unauthorized();

            const { id } = await request.json();
            if (!isUuid(id)) return badRequest("Invalid post id");

            const [post] = await db
                .select({ uuid: posts.uuid })
                .from(posts)
                .where(eq(posts.uuid, id))
                .limit(1);

            if (!post) return notFound("There is no post found with exact UUID.");

            const removed = await db
                .delete(postLikes)
                .where(and(eq(postLikes.postUuid, id), eq(postLikes.userId, me)))
                .returning({ postUuid: postLikes.postUuid });

            let liked: boolean;
            if (removed.length > 0) {
                liked = false;
            } else {
                await db
                    .insert(postLikes)
                    .values({ postUuid: id, userId: me })
                    .onConflictDoNothing();
                liked = true;
            }

            return NextResponse.json({ liked }, { status: 200 });
        }

        default:
            return notFound("Not found");
    }
}