// app/search/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import SearchView from "./SearchView";

export const metadata: Metadata = {
    title: "Search",
    robots: { index: false, follow: true },
};

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
                    Loading...
                </div>
            }
        >
            <SearchView />
        </Suspense>
    );
}