// lib/use-api.ts
import { api } from "@/lib/api/api";
import useSWR, { type SWRConfiguration } from "swr";

// Typed SWR hook. Pass the response type explicitly:
//   useApi<Post[]>("/api/posts/all/1")
// A null key skips the request.
export function useApi<T>(key: string | null, options?: SWRConfiguration<T>) {
    return useSWR<T>(key, (url: string) => api.get<T>(url), options);
}