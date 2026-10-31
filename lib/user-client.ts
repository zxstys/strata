// lib/user-client.ts
import { fetcher } from "@/lib/fetcher";
import type { UserPage } from "@/types/user";
import useSWR from "swr";

export const useUser = (username: string) =>
    useSWR<UserPage>(`/api/users/${encodeURIComponent(username)}`, fetcher);