// components/support/TicketChat.tsx
"use client";

import DraftCounter from "@/components/composer/DraftCounter";
import DraftSubmit from "@/components/composer/DraftSubmit";
import { createDraftStore } from "@/lib/composer/draft-store";
import { supportClient, useTicket } from "@/lib/support/support-client";
import { useTicketLive } from "@/lib/support/support-realtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MAX_CHARS = 2000;

export default function TicketChat({
    uuid,
    staffView,
}: {
    uuid: string;
    staffView: boolean;
}) {
    const { data, error, isLoading, mutate } = useTicket(uuid);
    const store = useMemo(() => createDraftStore(), []);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState("");

    const refresh = useCallback(() => {
        void mutate();
    }, [mutate]);
    useTicketLive(uuid, refresh);

    const count = data?.messages.length ?? 0;
    useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [count]);

    const send = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = store.get().trim();
        if (!text || sending) return;

        setSending(true);
        setSendError("");
        try {
            await supportClient.send(uuid, text);
            store.set("");
            if (inputRef.current) inputRef.current.value = "";
            await mutate();
        } catch (err) {
            setSendError(err instanceof Error ? err.message : "Couldn't send. Try again.");
        } finally {
            setSending(false);
        }
    };

    if (isLoading && !data) {
        return <p className="p-4 text-sm text-muted-foreground">Loading conversation...</p>;
    }
    if (error || !data) {
        return <p className="p-4 text-sm text-red-500">This conversation isn't available.</p>;
    }

    const closed = data.ticket.status === "resolved" || data.ticket.status === "rejected";

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {data.messages.map((m) => {
                    const right = staffView ? m.isStaff : !m.isStaff;
                    const label = m.isStaff ? "Strata Support" : staffView ? "User" : "You";

                    return (
                        <div key={m.id} className={`flex flex-col ${right ? "items-end" : "items-start"}`}>
                            <span className="mb-1 text-[11px] text-muted-foreground">
                                {label} · {new Date(m.createdAt).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                            <div
                                className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${right ? "bg-primary text-primary-foreground" : "bg-secondary"
                                    }`}
                            >
                                {m.content}
                            </div>
                        </div>
                    );
                })}

                {closed && (
                    <p className="text-center text-xs text-muted-foreground">
                        This request is closed. Replying will reopen it.
                    </p>
                )}
                <div ref={endRef} />
            </div>

            <form onSubmit={send} className="flex flex-col gap-2 border-t border-border p-3">
                {sendError && <p className="text-xs text-destructive">{sendError}</p>}

                <textarea
                    ref={inputRef}
                    rows={2}
                    maxLength={MAX_CHARS}
                    defaultValue=""
                    placeholder={staffView ? "Reply to the user" : "Write a message"}
                    onInput={(e) => store.set(e.currentTarget.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            void send();
                        }
                    }}
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />

                <div className="flex items-center justify-between gap-3">
                    <DraftCounter store={store} limit={MAX_CHARS} threshold={0.9} />
                    <DraftSubmit store={store} busy={sending} idleLabel="Send" busyLabel="Sending..." />
                </div>
            </form>
        </div>
    );
}