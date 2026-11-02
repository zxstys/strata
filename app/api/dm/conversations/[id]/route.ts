// app/api/dm/conversations/[id]/route.ts
import { db } from "@/lib/db/db";
import { isUuid } from "@/lib/comment/comment-query";
import {
    currentUser,
    dmUserFields,
    isMember,
    toDmMessage,
    toDmUser,
    unauthorized,
} from "@/lib/dm/dm-server";
import type { DmThread } from "@/types/dm";
import { conversationMembers, messages, user } from "@/schema";
import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, lt, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const PAGE = 50;

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const me = await currentUser();
    if (!me) return unauthorized();
    if (!isUuid(id)) {
        return NextResponse.json({ message: "Invalid conversation id." }, { status: 400 });
    }
    if (!(await isMember(id, me.id))) {
        return NextResponse.json({ message: "Conversation not found." }, { status: 404 });
    }

    const before = request.nextUrl.searchParams.get("before");
    const beforeDate = before ? new Date(before) : null;
    if (beforeDate && Number.isNaN(beforeDate.getTime())) {
        return NextResponse.json({ message: "Invalid cursor." }, { status: 400 });
    }

    const otherMember = alias(conversationMembers, "other_member");

    const [other] = await db
        .select({ ...dmUserFields, otherLastReadAt: otherMember.lastReadAt })
        .from(otherMember)
        .innerJoin(user, eq(user.id, otherMember.userId))
        .where(and(eq(otherMember.conversationId, id), ne(otherMember.userId, me.id)))
        .limit(1);

    if (!other) {
        return NextResponse.json({ message: "Conversation not found." }, { status: 404 });
    }

    const rows = await db
        .select({
            uuid: messages.id,
            conversationId: messages.conversationId,
            senderId: messages.senderId,
            content: messages.content,
            mediaUrl: messages.mediaUrl,
            createdAt: messages.createdAt,
        })
        .from(messages)
        .where(
            and(
                eq(messages.conversationId, id),
                beforeDate ? lt(messages.createdAt, beforeDate) : undefined
            )
        )
        .orderBy(desc(messages.createdAt))
        .limit(PAGE + 1);

    const hasMore = rows.length > PAGE;
    const page = rows.slice(0, PAGE).reverse();

    const body: DmThread = {
        id,
        other: toDmUser(other),
        otherLastReadAt: other.otherLastReadAt?.toISOString() ?? null,
        messages: page.map(toDmMessage),
        hasMore,
    };

    return NextResponse.json(body, { status: 200 });
}