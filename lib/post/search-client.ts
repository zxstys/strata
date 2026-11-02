// lib/search-client.ts
import { useApi } from "@/lib/api/use-api";
import type { PersonCard, SearchResult } from "@/types/search";

export const useSearch = (q: string) =>
    useApi<SearchResult>(q ? `/api/search?q=${encodeURIComponent(q)}` : null, {
        keepPreviousData: true,
    });

export const usePeople = () => useApi<PersonCard[]>("/api/people");