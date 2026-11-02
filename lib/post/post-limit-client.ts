// lib/post-limit-client.ts
import { useApi } from "@/lib/api/use-api";
import { FREE_POST_LIMIT } from "@/lib/post/post-rules";
import type { MyProfile } from "@/types/user";

// Returns null when the user can post without a limit.
export function usePostLimit(): number | null {
    const { data } = useApi<MyProfile>("/api/profile");
    const unlimited =
        !!data && (data.verified || (data.goldPermission && data.goldEnabled));
    return unlimited ? null : FREE_POST_LIMIT;
}