// app/api/dm/conversations/[id]/messages/route.ts
import { isUuid } from "@/lib/comment/comment-query";
import { db } from "@/lib/db/db";
import { currentUser, isMember, unauthorized } from "@/lib/dm/dm-server";
import { convChannel, push, userChannel } from "@/lib/dm/pusher-server";
import { isBlobUrl } from "@/lib/post/media";
import type { DmMessage } from "@/types/dm";
import { conversationMembers, conversations, messages } from "@/schema";
import { and, count, eq, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const MAX_CHARS = 2000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;

type RouteParams = { params: Promise<{ id: string }> };

const bad = (message: string) => NextResponse.json({ message }, { status: 400 });

export async function POST(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const me = await currentUser();
    if (!me) return unauthorized();
    if (!isUuid(id)) return bad("Invalid conversation id.");

    const body = await request.json().catch(() => null);
    const uuid = body?.uuid;
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const mediaUrl: string | null = body?.mediaUrl ?? null;

    if (!isUuid(uuid)) return bad("Invalid message id.");
    if (content.length > MAX_CHARS) {
        return bad(`Messages are limited to ${MAX_CHARS} characters.`);
    }
    if (!content && !mediaUrl) return bad("Write a message or attach an image.");
    if (mediaUrl !== null && !isBlobUrl(mediaUrl)) return bad("Invalid attachment.");

    if (!(await isMember(id, me.id))) {
        return NextResponse.json({ message: "Conversation not found." }, { status: 404 });
    }

    const [recent] = await db
        .select({ n: count() })
        .from(messages)
        .where(
            and(
                eq(messages.senderId, me.id),
                gt(messages.createdAt, new Date(Date.now() - RATE_WINDOW_MS))
            )
        );
    if ((recent?.n ?? 0) >= RATE_LIMIT) {
        return NextResponse.json(
            { message: "You're sending messages too fast." },
            { status: 429 }
        );
    }

    const now = new Date();

    const members = await db
        .select({ userId: conversationMembers.userId })
        .from(conversationMembers)
        .where(eq(conversationMembers.conversationId, id));

    // One batch = one transaction on Neon. The message, the conversation's
    // last-activity time, and the sender's read marker all update together.
    await db.batch([
        db
            .insert(messages)
            .values({
                id: uuid,
                conversationId: id,
                senderId: me.id,
                content,
                mediaUrl,
                createdAt: now,
            })
            .onConflictDoNothing(),
        db
            .update(conversations)
            .set({ lastMessageAt: now })
            .where(eq(conversations.id, id)),
        db
            .update(conversationMembers)
            .set({ lastReadAt: now })
            .where(
                and(
                    eq(conversationMembers.conversationId, id),
                    eq(conversationMembers.userId, me.id)
                )
            ),
    ]);

    const payload: DmMessage = {
        uuid,
        conversationId: id,
        senderId: me.id,
        content,
        mediaUrl,
        createdAt: now.toISOString(),
    };

    // Push to everyone watching this conversation (including the sender's other tabs),
    // then tell each member's inbox to refresh its ordering and unread counts.
    await push(convChannel(id), "message", payload);
    await Promise.all(
        members.map((m) => push(userChannel(m.userId), "conversation", { id }))
    );

    return NextResponse.json(payload, { status: 201 });
}