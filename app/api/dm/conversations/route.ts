// app/api/dm/conversations/route.ts
import { db } from "@/lib/db/db";
import { isModSql } from "@/lib/db/user-sql";
import { currentUser, pairKey, toDmUser, unauthorized } from "@/lib/dm/dm-server";
import { isUuid } from "@/lib/comment/comment-query";
import type { DmInboxItem } from "@/types/dm";
import { conversationMembers, conversations, messages, user } from "@/schema";
import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const me = await currentUser();
  if (!me) return unauthorized();

  const mine = alias(conversationMembers, "mine");
  const theirs = alias(conversationMembers, "theirs");

  const rows = await db
    .select({
      id: conversations.id,
      lastMessageAt: conversations.lastMessageAt,
      otherId: user.id,
      otherName: user.name,
      otherUsername: user.username,
      otherImage: user.image,
      otherVerified: user.verified,
      otherGold: sql<boolean>`(${user.goldPermission} and ${user.goldEnabled})`,
      otherMod: isModSql,
      unread: sql<number>`(
        select count(*)::int from ${messages}
        where ${messages.conversationId} = ${conversations.id}
          and ${messages.senderId} <> ${me.id}
          and ${messages.createdAt} > coalesce(${mine.lastReadAt}, 'epoch'::timestamp)
      )`,
    })
    .from(mine)
    .innerJoin(conversations, eq(conversations.id, mine.conversationId))
    .innerJoin(
      theirs,
      and(eq(theirs.conversationId, mine.conversationId), ne(theirs.userId, me.id))
    )
    .innerJoin(user, eq(user.id, theirs.userId))
    .where(eq(mine.userId, me.id))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(50);

  const ids = rows.map((r) => r.id);
  const lastRows = ids.length
    ? await db
        .selectDistinctOn([messages.conversationId], {
          conversationId: messages.conversationId,
          content: messages.content,
          mediaUrl: messages.mediaUrl,
          senderId: messages.senderId,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(inArray(messages.conversationId, ids))
        .orderBy(messages.conversationId, desc(messages.createdAt))
    : [];

  const lastBy = new Map(lastRows.map((m) => [m.conversationId, m]));

  const items: DmInboxItem[] = rows.map((r) => {
    const last = lastBy.get(r.id);
    return {
      id: r.id,
      lastMessageAt: r.lastMessageAt.toISOString(),
      unread: Number(r.unread) || 0,
      other: toDmUser({
        id: r.otherId,
        name: r.otherName,
        username: r.otherUsername,
        image: r.otherImage,
        verified: r.otherVerified,
        gold: r.otherGold,
        mod: r.otherMod,
      }),
      lastMessage: last
        ? {
            content: last.content,
            mediaUrl: last.mediaUrl ?? null,
            senderId: last.senderId,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
    };
  });

  return NextResponse.json(items, { status: 200 });
}

export async function POST(request: NextRequest) {
  const me = await currentUser();
  if (!me) return unauthorized();

  const body = await request.json().catch(() => null);
  const otherId = body?.userId;

  if (typeof otherId !== "string" || !otherId) {
    return NextResponse.json({ message: "userId is required." }, { status: 400 });
  }
  if (otherId === me.id) {
    return NextResponse.json({ message: "You can't message yourself." }, { status: 400 });
  }

  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, otherId))
    .limit(1);
  if (!target) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  const key = pairKey(me.id, otherId);

  const findExisting = () =>
    db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.pairKey, key))
      .limit(1);

  let [conv] = await findExisting();
  if (!conv) {
    await db
      .insert(conversations)
      .values({ pairKey: key })
      .onConflictDoNothing({ target: conversations.pairKey });
    [conv] = await findExisting();
  }

  await db
    .insert(conversationMembers)
    .values([
      { conversationId: conv.id, userId: me.id },
      { conversationId: conv.id, userId: otherId },
    ])
    .onConflictDoNothing();

  return NextResponse.json({ id: conv.id }, { status: 200 });
}