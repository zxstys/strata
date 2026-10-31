// lib/comment-client.ts
import { fetcher } from "@/lib/fetcher";
import type { PostComment } from "@/types/comment";
import type { Post } from "@/types/post";
import type { UserPage } from "@/types/user";
import useSWR, { mutate } from "swr";

export const useComments = (postUuid: string | null) =>
    useSWR<PostComment[]>(
        postUuid ? `/api/posts/comments/${postUuid}` : null,
        fetcher
    );

export const commentClient = {
    create: (postUuid: string, content: string, mediaUrl?: string) =>
        fetcher<PostComment>("/api/posts/comment", {
            method: "POST",
            body: { postUuid, content, mediaUrl: mediaUrl ?? null },
        }),

    remove: (uuid: string) =>
        fetcher("/api/posts/comment-delete", {
            method: "POST",
            body: { uuid },
        }),
};

const isPostKey = (key: unknown) =>
    typeof key === "string" &&
    (key.startsWith("/api/posts/all") ||
        key.startsWith("/api/posts/one/") ||
        key.startsWith("/api/users/"));

function applyCountDelta(current: unknown, postUuid: string, delta: number) {
    const bump = (p: Post): Post =>
        p.uuid === postUuid
            ? { ...p, comments: Math.max(0, (p.comments ?? 0) + delta) }
            : p;

    if (Array.isArray(current)) return (current as Post[]).map(bump);

    if (current && typeof current === "object") {
        if ("posts" in current) {
            const page = current as UserPage;
            return { ...page, posts: page.posts.map(bump) };
        }
        if ("uuid" in current) return bump(current as Post);
    }

    return current;
}

export const adjustCommentCount = (postUuid: string, delta: number) =>
    mutate(
        isPostKey,
        (current: unknown) => applyCountDelta(current, postUuid, delta),
        { revalidate: false }
    );