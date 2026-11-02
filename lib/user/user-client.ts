// lib/user-client.ts
import { useApi } from "@/lib/api/use-api";
import type { UserPage } from "@/types/user";

export const useUser = (username: string) =>
    useApi<UserPage>(`/api/users/${encodeURIComponent(username)}`);