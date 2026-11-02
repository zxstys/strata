// components/dm/MessageButton.tsx
"use client";

import { dmClient } from "@/lib/dm/dm-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuMessageSquare } from "react-icons/lu";

export default function MessageButton({ userId }: { userId: string }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const open = async () => {
        setBusy(true);
        setError("");
        try {
            const { id } = await dmClient.open(userId);
            router.push(`/messages/${id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't open chat.");
            setBusy(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={open}
                disabled={busy}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-hover disabled:opacity-50"
            >
                <LuMessageSquare className="size-4" />
                {busy ? "Opening..." : "Message"}
            </button>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}