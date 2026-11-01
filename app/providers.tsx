// app/providers.tsx
"use client";

import { swrFetcher } from "@/lib/api/api";
import { SWRConfig } from "swr";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                fetcher: swrFetcher,
                revalidateOnFocus: false,
                dedupingInterval: 4000,
                keepPreviousData: true,
                errorRetryCount: 1,
            }
            }
        >
            {children}
        </SWRConfig>
    );
}