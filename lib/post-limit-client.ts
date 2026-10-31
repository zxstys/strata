// lib/post-limit-client.ts
import { fetcher } from "@/lib/fetcher";
import { FREE_POST_LIMIT } from "@/lib/post-rules";
import type { MyProfile } from "@/types/user";
import useSWR from "swr";

// Returns null when the user can post without a limit.
// While loading, it returns the free limit. The server still enforces the real rule.
export function usePostLimit(): number | null {
    const { data } = useSWR<MyProfile>("/api/profile", fetcher);
    const unlimited =
        !!data && (data.verified || (data.goldPermission && data.goldEnabled));
    return unlimited ? null : FREE_POST_LIMIT;
}