// app/messages/[id]/ThreadView.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import Avatar from "@/components/Avatar";
import { VerifiedBadge } from "@/components/UserName";
import { authClient } from "@/lib/auth/auth-client";
import { dmClient, patchThread, upsertMessage, useThread } from "@/lib/dm/dm-client";
import { getRealtime } from "@/lib/dm/realtime-client";
import { uploadMedia } from "@/lib/post/upload-client";
import type { DmMessage, LocalMessage } from "@/types/dm";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LuArrowLeft, LuImagePlus, LuSend, LuX } from "react-icons/lu";
import type { Channel } from "pusher-js";

export default function ThreadView({ id }: { id: string }) {
    const { data: session } = authClient.useSession();
    const meId = session?.user.id ?? null;
    const { data: thread, error } = useThread(id);

    const [draft, setDraft] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [typing, setTyping] = useState(false);

    const channelRef = useRef<Channel | null>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastTypingSent = useRef(0);
    const pendingFiles = useRef(new Map<string, File>());
    const endRef = useRef<HTMLDivElement>(null);

    // Live updates for this conversation.
    useEffect(() => {
        if (!meId) return;

        const name = `private-conv-${id}`;
        const channel = getRealtime().subscribe(name);
        channelRef.current = channel;

        const onMessage = (msg: DmMessage) => {
            patchThread(id, (t) => upsertMessage(t, msg));
            if (msg.senderId !== meId) setTyping(false);
        };

        const onRead = (r: { userId: string; at: string }) => {
            if (r.userId !== meId) {
                patchThread(id, (t) => ({ ...t, otherLastReadAt: r.at }));
            }
        };

        const onTyping = (t: { userId: string }) => {
            if (t.userId === meId) return;
            setTyping(true);
            clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setTyping(false), 3000);
        };

        channel.bind("message", onMessage);
        channel.bind("read", onRead);
        channel.bind("client-typing", onTyping);

        return () => {
            channel.unbind("message", onMessage);
            channel.unbind("read", onRead);
            channel.unbind("client-typing", onTyping);
            getRealtime().unsubscribe(name);
            channelRef.current = null;
            clearTimeout(typingTimer.current);
        };
    }, [id, meId]);

    // Mark the thread read when it opens and whenever a new message from them arrives.
    const incoming = thread?.messages.filter((m) => m.senderId !== meId).length ?? 0;
    const loaded = Boolean(thread);
    useEffect(() => {
        if (!meId || !loaded) return;
        dmClient.markRead(id).catch(() => { });
    }, [id, meId, loaded, incoming]);

    // Keep the newest message in view.
    const count = thread?.messages.length ?? 0;
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [count, typing]);

    const onDraftChange = (value: string) => {
        setDraft(value);
        const now = Date.now();
        if (value && meId && now - lastTypingSent.current > 2000) {
            lastTypingSent.current = now;
            channelRef.current?.trigger("client-typing", { userId: meId });
        }
    };

    const deliver = async (msg: LocalMessage) => {
        const pending = pendingFiles.current.get(msg.uuid) ?? null;
        let mediaUrl = msg.mediaUrl;

        try {
            if (pending && !mediaUrl) mediaUrl = await uploadMedia(pending, "post-image");
            const saved = await dmClient.send(id, {
                uuid: msg.uuid,
                content: msg.content,
                mediaUrl,
            });
            pendingFiles.current.delete(msg.uuid);
            await patchThread(id, (t) => upsertMessage(t, saved));
        } catch {
            await patchThread(id, (t) =>
                upsertMessage(t, { ...msg, mediaUrl, status: "failed" })
            );
        }
    };

    const submit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = draft.trim();
        if (!meId || (!text && !file)) return;

        const uuid = crypto.randomUUID();
        if (file) pendingFiles.current.set(uuid, file);

        const msg: LocalMessage = {
            uuid,
            conversationId: id,
            senderId: meId,
            content: text,
            mediaUrl: null,
            createdAt: new Date().toISOString(),
            status: "sending",
        };

        setDraft("");
        setFile(null);
        patchThread(id, (t) => upsertMessage(t, msg));
        void deliver(msg);
    };

    const retry = (msg: LocalMessage) => {
        const sending = { ...msg, status: "sending" as const };
        patchThread(id, (t) => upsertMessage(t, sending));
        void deliver(sending);
    };

    if (error) {
        return (
            <div className="p-6 text-sm text-muted-foreground">
                This conversation isn't available.
            </div>
        );
    }
    if (!thread) {
        return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
    }

    const { other } = thread;
    const list = thread.messages;

    const lastMine = [...list]
        .reverse()
        .find((m) => m.senderId === meId && !m.status);
    const seen = Boolean(
        lastMine &&
        thread.otherLastReadAt &&
        new Date(thread.otherLastReadAt) >= new Date(lastMine.createdAt)
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                <Link
                    href="/messages"
                    aria-label="Back to messages"
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-hover lg:hidden"
                >
                    <LuArrowLeft className="size-4" />
                </Link>
                <Link href={`/users/${other.username ?? other.id}`} className="flex min-w-0 items-center gap-3">
                    <Avatar name={other.name} src={other.image} />
                    <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate text-sm font-medium">
                            {other.name}
                            <VerifiedBadge verified={other.verified} gold={other.gold} mod={other.mod} />
                        </p>
                        {other.username && (
                            <p className="truncate text-xs text-muted-foreground">@{other.username}</p>
                        )}
                    </div>
                </Link>
            </header>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {list.map((m) => {
                    const mine = m.senderId === meId;
                    return (
                        <div key={m.uuid} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                            <div
                                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary"
                                    } ${m.status === "failed" ? "opacity-60" : ""}`}
                            >
                                {m.mediaUrl && (
                                    <img src={m.mediaUrl} alt="" className="mb-1 max-h-64 rounded-lg" />
                                )}
                                {m.content && (
                                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                                )}
                            </div>

                            <div className="mt-0.5 flex gap-2 text-[11px] text-muted-foreground">
                                <time>
                                    {new Date(m.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </time>
                                {m.status === "sending" && <span>Sending…</span>}
                                {m.status === "failed" && (
                                    <button onClick={() => retry(m)} className="text-destructive underline">
                                        Failed · Retry
                                    </button>
                                )}
                                {seen && m.uuid === lastMine?.uuid && <span>Seen</span>}
                            </div>
                        </div>
                    );
                })}

                {typing && (
                    <p className="text-xs text-muted-foreground">{other.name} is typing…</p>
                )}
                <div ref={endRef} />
            </div>

            <form onSubmit={submit} className="flex flex-col gap-2 border-t border-border p-3">
                {file && (
                    <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5 text-xs">
                        <span className="truncate">{file.name}</span>
                        <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment">
                            <LuX />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <label
                        aria-label="Attach image"
                        className="cursor-pointer rounded-full p-2 text-muted-foreground hover:bg-hover hover:text-foreground"
                    >
                        <LuImagePlus className="size-5" />
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="sr-only"
                            onChange={(e) => {
                                setFile(e.target.files?.[0] ?? null);
                                e.target.value = "";
                            }}
                        />
                    </label>

                    <textarea
                        rows={1}
                        value={draft}
                        maxLength={2000}
                        placeholder="Message"
                        onChange={(e) => onDraftChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                submit();
                            }
                        }}
                        className="max-h-40 min-h-10 flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />

                    <button
                        type="submit"
                        aria-label="Send"
                        disabled={!draft.trim() && !file}
                        className="rounded-full bg-primary p-2.5 text-primary-foreground disabled:opacity-40"
                    >
                        <LuSend className="size-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}