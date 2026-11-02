// lib/comment-client.ts
import { api } from "@/lib/api/api";
import type { PostComment } from "@/types/comment";
import type { Post } from "@/types/post";
import type { UserPage } from "@/types/user";
import useSWR, { mutate } from "swr";
import { useApi } from "../api/use-api";

export const useComments = (postUuid: string | null) =>
  useApi<PostComment[]>(postUuid ? `/api/posts/comments/${postUuid}` : null);

export const commentClient = {
    create: (postUuid: string, content: string, mediaUrl?: string) =>
        api.post<PostComment>("/api/posts/comment", { postUuid, content, mediaUrl: mediaUrl ?? null }),
    remove: (uuid: string) => api.post("/api/posts/comment-delete", { uuid }),
};

const isCountKey = (key: unknown) =>
    typeof key === "string" &&
    (key.startsWith("/api/posts/all") ||
        key.startsWith("/api/posts/one/") ||
        key.startsWith("/api/users/"));

const bump = (post: Post, postUuid: string, delta: number): Post =>
    post.uuid === postUuid ? { ...post, comments: Math.max(0, post.comments + delta) } : post;

function applyDelta(current: unknown, postUuid: string, delta: number) {
    if (Array.isArray(current)) {
        return (current as Post[]).map((p) => bump(p, postUuid, delta));
    }
    if (current && typeof current === "object") {
        if ("posts" in current) {
            const page = current as UserPage;
            return { ...page, posts: page.posts.map((p) => bump(p, postUuid, delta)) };
        }
        if ("uuid" in current) return bump(current as Post, postUuid, delta);
    }
    return current;
}

// Updates the reply count in every cached list without refetching.
export const adjustCommentCount = (postUuid: string, delta: number) =>
    mutate(isCountKey, (current: unknown) => applyDelta(current, postUuid, delta), {
        revalidate: false,
    });