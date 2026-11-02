// components/composer/DraftCounter.tsx
"use client";

import type { DraftStore } from "@/lib/composer/draft-store";
import { useSyncExternalStore } from "react";

export default function DraftCounter({
    store,
    limit,
    threshold = 0.8,
}: {
    store: DraftStore;
    limit: number | null;
    threshold?: number;
}) {
    // Read the length, not the text. A number snapshot also means React only
    // re-renders when the length changes, not on every character.
    const length = useSyncExternalStore(
        store.subscribe,
        () => store.get().length,
        () => 0
    );

    if (limit === null || length < limit * threshold) return null;

    const remaining = limit - length;
    return (
        <span
            className={`text-xs tabular-nums ${remaining < 0 ? "text-destructive" : "text-muted-foreground"
                }`}
        >
            {remaining}
        </span>
    );
}