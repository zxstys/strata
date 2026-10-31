// lib/follow-client.ts
import { fetcher } from "@/lib/fetcher";

export const followClient = {
    set: (userId: string, follow: boolean) =>
        fetcher("/api/follows", {
            method: "POST",
            body: { userId, follow },
        }),
};