// components/FollowButton.tsx
"use client";

import { followClient } from "@/lib/follow/follow-client";
import { useState } from "react";

export default function FollowButton({
    userId,
    following,
    onChanged,
}: {
    userId: string;
    following: boolean;
    onChanged: () => Promise<unknown>;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const toggle = async () => {
        setBusy(true);
        setError("");
        try {
            await followClient.set(userId, !following);
            await onChanged();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't update follow.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={toggle}
                disabled={busy}
                className={
                    following
                        ? "rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
                        : "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                }
            >
                {busy ? "..." : following ? "Following" : "Follow"}
            </button>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}