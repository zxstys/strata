// lib/user/suggest-client.ts
import { useApi } from "@/lib/api/use-api";
import type { DmUser } from "@/types/dm";

// Pass an empty string to skip the request.
export const useUserSuggest = (q: string) =>
    useApi<DmUser[]>(q ? `/api/users/suggest?q=${encodeURIComponent(q)}` : null, {
        keepPreviousData: true,
        dedupingInterval: 300,
    });