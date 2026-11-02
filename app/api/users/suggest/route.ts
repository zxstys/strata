// app/api/users/suggest/route.ts
import { db } from "@/lib/db/db";
import { isModSql } from "@/lib/db/user-sql";
import { user } from "@/schema";
import { asc, ilike, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const escapeLike = (s: string) => s.replace(/[%_\\]/g, "\\$&");

export async function GET(request: NextRequest) {
    const q = (request.nextUrl.searchParams.get("q") ?? "")
        .trim()
        .replace(/^@/, "")
        .toLowerCase()
        .slice(0, 20);

    if (!q) return NextResponse.json([], { status: 200 });

    const rows = await db
        .select({
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
            verified: user.verified,
            gold: sql<boolean>`(${user.goldPermission} and ${user.goldEnabled})`,
            mod: isModSql,
        })
        .from(user)
        .where(ilike(user.username, `${escapeLike(q)}%`))
        .orderBy(asc(user.username))
        .limit(6);

    return NextResponse.json(
        rows.map((r) => ({
            ...r,
            image: r.image ?? null,
            gold: Boolean(r.gold),
            mod: Boolean(r.mod),
        })),
        { status: 200 }
    );
}