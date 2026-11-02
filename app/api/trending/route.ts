// app/api/trending/route.ts
import { db } from "@/lib/db/db";
import { postTags } from "@/schema";
import { count, desc, gt } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const getTrending = unstable_cache(
    async () => {
        const rows = await db
            .select({ tag: postTags.tag, posts: count() })
            .from(postTags)
            .where(gt(postTags.createdAt, new Date(Date.now() - WINDOW_MS)))
            .groupBy(postTags.tag)
            .orderBy(desc(count()))
            .limit(10);

        return rows.map((r) => ({ tag: r.tag, posts: Number(r.posts) }));
    },
    ["trending-tags"],
    { revalidate: 60 }
);

export async function GET() {
    return NextResponse.json(await getTrending(), { status: 200 });
}