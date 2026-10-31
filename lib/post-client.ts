// lib/post-client.ts
import { fetcher } from "@/lib/fetcher";
import type { Post } from "@/types/post";
import useSWR, { mutate } from "swr";

export const postClient = {
    all: (page: number = 1) => useSWR<Post[]>("/api/posts/all/" + page, fetcher),

    create: (content: string, mediaUrl?: string) =>
        fetcher("/api/posts/create", {
            method: "POST",
            body: { content, mediaUrl: mediaUrl ?? null },
        }),

    like: (id: string) =>
        fetcher("/api/posts/like", {
            method: "POST",
            body: { id },
        }),

    edit: (uuid: string, content: string) =>
        fetcher("/api/posts/edit", {
            method: "POST",
            body: { uuid, content },
        }),

    remove: (uuid: string) =>
        fetcher("/api/posts/delete", {
            method: "POST",
            body: { uuid },
        }),

    pin: (uuid: string, pinned: boolean) =>
        fetcher("/api/posts/pin", {
            method: "POST",
            body: { uuid, pinned },
        }),
};

export const usePost = (uuid: string | null) =>
    useSWR<Post>(uuid ? `/api/posts/one/${uuid}` : null, fetcher);

// Refreshes every cached feed, profile, and single-post view after a change.
export const refreshPostLists = () =>
    mutate(
        (key) =>
            typeof key === "string" &&
            (key.startsWith("/api/posts/") || key.startsWith("/api/users/"))
    );