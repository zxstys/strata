// components/composer/DraftSubmit.tsx
"use client";

import type { DraftStore } from "@/lib/composer/draft-store";
import { useSyncExternalStore } from "react";

export default function DraftSubmit({
    store,
    hasAttachment = false,
    busy = false,
    idleLabel,
    busyLabel,
}: {
    store: DraftStore;
    hasAttachment?: boolean;
    busy?: boolean;
    idleLabel: string;
    busyLabel: string;
}) {
    const hasText = useSyncExternalStore(
        store.subscribe,
        () => store.get().trim().length > 0,
        () => false
    );

    const canSend = !busy && (hasText || hasAttachment);

    return (
        <button
            type="submit"
            disabled={!canSend}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
            {busy ? busyLabel : idleLabel}
        </button>
    );
}