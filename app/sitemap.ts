// app/sitemap.ts
import { db } from "@/lib/db/db";
import { SITE_URL } from "@/lib/site";
import { posts, user } from "@/schema";
import { desc, isNotNull } from "drizzle-orm";
import type { MetadataRoute } from "next";

// Sitemaps allow up to 50,000 URLs per file. Adjust the limits if you grow past them.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [users, recentPosts] = await Promise.all([
        db
            .select({ username: user.username, updatedAt: user.updatedAt })
            .from(user)
            .where(isNotNull(user.username))
            .limit(5000),
        db
            .select({ uuid: posts.uuid, createdAt: posts.createdAt })
            .from(posts)
            .orderBy(desc(posts.createdAt))
            .limit(5000),
    ]);

    return [
        { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
        ...users.map((u): MetadataRoute.Sitemap[number] => ({
            url: `${SITE_URL}/users/${u.username}`,
            lastModified: u.updatedAt,
            changeFrequency: "daily",
            priority: 0.6,
        })),
        ...recentPosts.map((p): MetadataRoute.Sitemap[number] => ({
            url: `${SITE_URL}/posts/${p.uuid}`,
            lastModified: p.createdAt,
            changeFrequency: "monthly",
            priority: 0.5,
        })),
    ];
}