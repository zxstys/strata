// lib/follow-client.ts
import { api } from "@/lib/api/api";

export const followClient = {
    set: (userId: string, follow: boolean) =>
        api.post<{ following: boolean }>("/api/follows", { userId, follow }),
};