// lib/dm/dm-server.ts
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { isModSql } from "@/lib/db/user-sql";
import { conversationMembers, user } from "@/schema";
import type { DmMessage, DmUser } from "@/types/dm";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function currentUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
}

export const unauthorized = () =>
    NextResponse.json({ message: "Unauthorized" }, { status: 401 });

export async function isMember(conversationId: string, userId: string) {
    const [row] = await db
        .select({ userId: conversationMembers.userId })
        .from(conversationMembers)
        .where(
            and(
                eq(conversationMembers.conversationId, conversationId),
                eq(conversationMembers.userId, userId)
            )
        )
        .limit(1);
    return Boolean(row);
}

export const pairKey = (a: string, b: string) => [a, b].sort().join(":");

export const dmUserFields = {
    id: user.id,
    name: user.name,
    username: user.username,
    image: user.image,
    verified: user.verified,
    gold: sql<boolean>`(${user.goldPermission} and ${user.goldEnabled})`,
    mod: isModSql,
};

type DmUserRow = {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    verified: boolean;
    gold: boolean;
    mod: boolean;
};

export const toDmUser = (r: DmUserRow): DmUser => ({
    id: r.id,
    name: r.name,
    username: r.username,
    image: r.image ?? null,
    verified: r.verified,
    gold: Boolean(r.gold),
    mod: Boolean(r.mod),
});

export const toDmMessage = (r: {
    uuid: string;
    conversationId: string;
    senderId: string;
    content: string;
    mediaUrl: string | null;
    createdAt: Date;
}): DmMessage => ({
    uuid: r.uuid,
    conversationId: r.conversationId,
    senderId: r.senderId,
    content: r.content,
    mediaUrl: r.mediaUrl ?? null,
    createdAt: r.createdAt.toISOString(),
});