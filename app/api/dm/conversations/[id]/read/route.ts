// app/api/dm/conversations/[id]/read/route.ts
import { isUuid } from "@/lib/comment/comment-query";
import { db } from "@/lib/db/db";
import { currentUser, isMember, unauthorized } from "@/lib/dm/dm-server";
import { convChannel, push } from "@/lib/dm/pusher-server";
import { conversationMembers } from "@/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const me = await currentUser();
  if (!me) return unauthorized();
  if (!isUuid(id) || !(await isMember(id, me.id))) {
    return NextResponse.json({ message: "Conversation not found." }, { status: 404 });
  }

  const now = new Date();

  await db
    .update(conversationMembers)
    .set({ lastReadAt: now })
    .where(
      and(
        eq(conversationMembers.conversationId, id),
        eq(conversationMembers.userId, me.id)
      )
    );

  await push(convChannel(id), "read", { userId: me.id, at: now.toISOString() });

  return NextResponse.json({ message: "ok" }, { status: 200 });
}