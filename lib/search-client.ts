// lib/search-client.ts
import { fetcher } from "@/lib/fetcher";
import type { PersonCard, SearchResult } from "@/types/search";
import useSWR from "swr";

export const useSearch = (q: string) =>
    useSWR<SearchResult>(
        q ? `/api/search?q=${encodeURIComponent(q)}` : null,
        fetcher,
        { keepPreviousData: true }
    );

export const usePeople = () =>
    useSWR<PersonCard[]>("/api/people", fetcher);