// lib/user-client.ts
import { fetcher } from "@/lib/api/fetcher";
import type { UserPage } from "@/types/user";
import useSWR from "swr";
import { api } from "../api/api";

export const useUser = (username: string) =>
    useSWR<UserPage>(`/api/users/${encodeURIComponent(username)}`, api.get);