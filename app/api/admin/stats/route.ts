// app/api/admin/stats/route.ts
import type { AdminStats, Day } from "@/types/admin";
import { forbidden, getAdminSession } from "@/lib/admin/admin";
import { db } from "@/lib/db/db";
import { comments, postLikes, posts, user } from "@/schema";
import { count, eq, gte, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

const DAYS = 14;
const DAY_MS = 86_400_000;

const dayOf = (col: AnyPgColumn) =>
    sql<string>`to_char(date_trunc('day', ${col}), 'YYYY-MM-DD')`;

// The last n calendar days (UTC) as YYYY-MM-DD, oldest first.
function lastDays(n: number): string[] {
    const now = Date.now();
    return Array.from({ length: n }, (_, i) =>
        new Date(now - (n - 1 - i) * DAY_MS).toISOString().slice(0, 10)
    );
}

// Counts rows per day and fills gaps with zeros so every day appears.
async function dailySeries(table: PgTable, col: AnyPgColumn, days: string[]): Promise<Day[]> {
    const rows = await db
        .select({ day: dayOf(col), n: count() })
        .from(table)
        .where(gte(col, new Date(`${days[0]}T00:00:00Z`)))
        .groupBy(dayOf(col));

    const byDay = new Map(rows.map((r) => [r.day, r.n]));
    return days.map((day) => ({ day, value: byDay.get(day) ?? 0 }));
}

async function total(table: PgTable, where?: SQL): Promise<number> {
    const [row] = await db.select({ n: count() }).from(table).where(where);
    return row?.n ?? 0;
}

const getStats = unstable_cache(
    async (): Promise<AdminStats> => {
        const days = lastDays(DAYS);
        const since24h = new Date(Date.now() - DAY_MS);

        const [
            users,
            admins,
            verified,
            goldPermitted,
            allPosts,
            postsToday,
            replies,
            likes,
            [mixRow],
            usersSeries,
            postsSeries,
            repliesSeries,
            likesSeries,
        ] = await Promise.all([
            total(user),
            total(user, eq(user.role, "admin")),
            total(user, eq(user.verified, true)),
            total(user, eq(user.goldPermission, true)),
            total(posts),
            total(posts, gte(posts.createdAt, since24h)),
            total(comments),
            total(postLikes),
            db
                .select({
                    admins: sql<number>`count(*) filter (where ${user.role} = 'admin')::int`,
                    verified: sql<number>`count(*) filter (where ${user.verified} and coalesce(${user.role}, '') <> 'admin')::int`,
                    goldOnly: sql<number>`count(*) filter (where ${user.goldPermission} and not ${user.verified} and coalesce(${user.role}, '') <> 'admin')::int`,
                    total: sql<number>`count(*)::int`,
                })
                .from(user),
            dailySeries(user, user.createdAt, days),
            dailySeries(posts, posts.createdAt, days),
            dailySeries(comments, comments.createdAt, days),
            dailySeries(postLikes, postLikes.createdAt, days),
        ]);

        const mixAdmins = Number(mixRow?.admins ?? 0);
        const mixVerified = Number(mixRow?.verified ?? 0);
        const mixGold = Number(mixRow?.goldOnly ?? 0);
        const mixTotal = Number(mixRow?.total ?? 0);

        return {
            totals: {
                users,
                admins,
                verified,
                goldPermitted,
                posts: allPosts,
                postsToday,
                replies,
                likes,
            },
            series: {
                users: usersSeries,
                posts: postsSeries,
                replies: repliesSeries,
                likes: likesSeries,
            },
            mix: {
                admins: mixAdmins,
                verified: mixVerified,
                goldOnly: mixGold,
                regular: Math.max(0, mixTotal - mixAdmins - mixVerified - mixGold),
            },
        };
    },
    ["admin-stats"],
    { revalidate: 60 }
);

export async function GET() {
    try {
        if (!(await getAdminSession())) return forbidden();
        return NextResponse.json(await getStats(), { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Stats failed.";
        console.error("[admin/stats]", message);
        return NextResponse.json({ message }, { status: 500 });
    }
}