// lib/search-client.ts
import { api } from "@/lib/api/api";
import type { PersonCard, SearchResult } from "@/types/search";
import useSWR from "swr";

export const useSearch = (q: string) =>
    useSWR<SearchResult>(
        q ? `/api/search?q=${encodeURIComponent(q)}` : null,
        (url: string) => api.get<SearchResult>(url),
        { keepPreviousData: true }
    );

export const usePeople = () =>
    useSWR<PersonCard[]>(
        "/api/people",
        (url: string) => api.get<PersonCard[]>(url)
    );