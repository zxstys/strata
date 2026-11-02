// lib/post-client.ts
import { api } from "@/lib/api/api";
import type { Post } from "@/types/post";
import useSWR, { mutate } from "swr";
import { useApi } from "@/lib/api/use-api";

const feedKey = (page: number) => `/api/posts/all/${page}`;
const postKey = (uuid: string) => `/api/posts/one/${uuid}`;

export const usePosts = (page = 1) => useApi<Post[]>(feedKey(page));

export const usePost = (uuid: string | null, fallbackData?: Post | null) =>
    useApi<Post>(uuid ? postKey(uuid) : null, {
        fallbackData: fallbackData ?? undefined,
    });

export const postClient = {
    create: (content: string, mediaUrl?: string) =>
        api.post<{ uuid: string }>("/api/posts/create", { content, mediaUrl: mediaUrl ?? null }),
    edit: (uuid: string, content: string) =>
        api.post("/api/posts/edit", { uuid, content }),
    remove: (uuid: string) => api.post("/api/posts/delete", { uuid }),
    pin: (uuid: string, pinned: boolean) => api.post("/api/posts/pin", { uuid, pinned }),
    like: (uuid: string) => api.post<{ liked: boolean }>("/api/posts/like", { id: uuid }),
};

const isPostCacheKey = (key: unknown) =>
    typeof key === "string" &&
    (key.startsWith("/api/posts/") ||
        key.startsWith("/api/users/") ||
        key.startsWith("/api/tags/"));

// Revalidates every cached feed, profile, and single-post view.
export const refreshPostLists = () => mutate(isPostCacheKey);