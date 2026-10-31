// lib/post-query.ts
import { sql } from "drizzle-orm";
import { comments, postLikes, posts, user } from "@/schema";
import type { Post } from "@/types/post";

export function postQueryFields(viewerId: string | null) {
    return {
        uuid: posts.uuid,
        content: posts.content,
        mediaUrl: posts.mediaUrl,
        createdAt: posts.createdAt,
        pinnedAt: posts.pinnedAt,
        editedAt: posts.editedAt,
        authorId: user.id,
        authorName: user.name,
        authorUsername: user.username,
        authorImage: user.image,
        authorVerified: user.verified,
        authorGold: sql<boolean>`(${user.goldPermission} and ${user.goldEnabled})`,
        likes: sql<number>`(
      select count(*)::int from ${postLikes}
      where ${postLikes.postUuid} = ${posts.uuid}
    )`,
        likedByMe: viewerId
            ? sql<boolean>`exists (
          select 1 from ${postLikes}
          where ${postLikes.postUuid} = ${posts.uuid}
          and ${postLikes.userId} = ${viewerId}
        )`
            : sql<boolean>`false`,
        commentCount: sql<number>`(
      select count(*)::int from ${comments}
      where ${comments.postUuid} = ${posts.uuid}
    )`,
        mine: viewerId
            ? sql<boolean>`${posts.userId} = ${viewerId}`
            : sql<boolean>`false`,
    };
}

type PostRow = {
    uuid: string;
    content: string;
    mediaUrl: string | null;
    createdAt: Date;
    pinnedAt: Date | null;
    editedAt: Date | null;
    authorId: string;
    authorName: string;
    authorUsername: string | null;
    authorImage: string | null;
    authorVerified: boolean;
    authorGold: boolean;
    likes: number;
    likedByMe: boolean;
    commentCount: number;
    mine: boolean;
};

export function toPost(r: PostRow): Post {
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
        likes: Number(r.likes) || 0,
        likedByMe: Boolean(r.likedByMe),
        comments: Number(r.commentCount) || 0,
        pinned: Boolean(r.pinnedAt),
        edited: Boolean(r.editedAt),
        mine: Boolean(r.mine),
    };
}