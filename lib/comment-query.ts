// lib/comment-query.ts
import { sql } from "drizzle-orm";
import { comments, user } from "@/schema";
import type { PostComment } from "@/types/comment";

export const isUuid = (v: unknown): v is string =>
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export function commentQueryFields(viewerId: string | null) {
    return {
        uuid: comments.uuid,
        content: comments.content,
        mediaUrl: comments.mediaUrl,
        createdAt: comments.createdAt,
        authorId: user.id,
        authorName: user.name,
        authorUsername: user.username,
        authorImage: user.image,
        authorVerified: user.verified,
        authorGold: sql<boolean>`(${user.goldPermission} and ${user.goldEnabled})`,
        canDelete: viewerId
            ? sql<boolean>`${comments.userId} = ${viewerId}`
            : sql<boolean>`false`,
    };
}

type CommentRow = {
    uuid: string;
    content: string;
    mediaUrl: string | null;
    createdAt: Date;
    authorId: string;
    authorName: string;
    authorUsername: string | null;
    authorImage: string | null;
    authorVerified: boolean;
    authorGold: boolean;
    canDelete: boolean;
};

export function toComment(r: CommentRow): PostComment {
    return {
        uuid: r.uuid,
        content: r.content,
        mediaUrl: r.mediaUrl ?? null,
        createdAt: r.createdAt.toISOString(),
        author: {
            id: r.authorId,
            name: r.authorName,
            username: r.authorUsername,
            image: r.authorImage ?? null,
            verified: r.authorVerified,
            gold: r.authorGold,
        },
        canDelete: r.canDelete,
    };
}