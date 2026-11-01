// lib/seo-data.ts
import { isUuid } from "@/lib/comment/comment-query";
import { db } from "@/lib/db/db";
import { postQueryFields, toPost } from "@/lib/post/post-query";
import { posts, user } from "@/schema";
import { eq, or } from "drizzle-orm";
import { cache } from "react";

// cache() dedupes these calls within one request, so generateMetadata
// and the page body share a single query.
export const getPublicPost = cache(async (uuid: string) => {
    if (!isUuid(uuid)) return null;

    const [row] = await db
        .select(postQueryFields(null))
        .from(posts)
        .innerJoin(user, eq(posts.userId, user.id))
        .where(eq(posts.uuid, uuid))
        .limit(1);

    return row ? toPost(row) : null;
});

export const getPublicUserMeta = cache(async (key: string) => {
    const [row] = await db
        .select({
            name: user.name,
            username: user.username,
            about: user.about,
            image: user.image,
        })
        .from(user)
        .where(or(eq(user.username, key.toLowerCase()), eq(user.id, key)))
        .limit(1);

    return row ?? null;
});