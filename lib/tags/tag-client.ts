// lib/tags/tag-client.ts
import { useApi } from "@/lib/api/use-api";
import type { Post } from "@/types/post";

export type TrendingTag = { tag: string; posts: number };

export const useTrending = () =>
    useApi<TrendingTag[]>("/api/trending", {
        revalidateOnFocus: false,
        refreshInterval: 60_000,
    });

export const useTagFeed = (tag: string) =>
    useApi<Post[]>(`/api/tags/${encodeURIComponent(tag)}`);