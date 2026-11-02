// app/support/page.tsx
"use client";

import Nav from "@/components/Nav";
import StatusPill from "@/components/status/StatusPill";
import NewRequestForm from "@/components/support/NewRequestForm";
import TicketChat from "@/components/support/TicketChat";
import { authClient } from "@/lib/auth/auth-client";
import { TYPE_INFO } from "@/lib/support/support";
import { useMyTickets } from "@/lib/support/support-client";
import { useUserSupportLive } from "@/lib/support/support-realtime";
import { useCallback, useState } from "react";
import { LuArrowLeft, LuPlus } from "react-icons/lu";

export default function SupportPage() {
    const { data: session, isPending } = authClient.useSession();
    const signedIn = Boolean(session);
    const { data: tickets, error, isLoading, mutate } = useMyTickets(signedIn);

    const [selected, setSelected] = useState<string | null>(null);
    const [composing, setComposing] = useState(false);
    const [notice, setNotice] = useState("");

    const refresh = useCallback(() => {
        void mutate();
    }, [mutate]);
    useUserSupportLive(session?.user.id ?? null, refresh);

    const current = tickets?.find((t) => t.uuid === selected);

    return (
        <div className="min-h-screen">
            <div className="mx-auto w-full max-w-xl">
                <Nav session={session} />

                <main className="flex flex-col gap-6 px-4 py-6">
                    {!signedIn && !isPending && (
                        <>
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight">Support</h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Account recovery and questions. We'll reply to your email.
                                </p>
                            </div>
                            <NewRequestForm
                                signedIn={false}
                                onCreated={() => setNotice("Request sent. We'll reply to your email.")}
                            />
                            {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
                        </>
                    )}

                    {signedIn && selected && (
                        <section className="flex flex-col gap-3">
                            <button
                                onClick={() => setSelected(null)}
                                className="flex w-fit items-center gap-2 rounded-full px-2 py-1.5 text-sm text-muted-foreground hover:bg-hover hover:text-foreground"
                            >
                                <LuArrowLeft className="size-4" />
                                All requests
                            </button>

                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h1 className="truncate text-lg font-semibold tracking-tight">
                                        {current?.subject ?? "Request"}
                                    </h1>
                                    {current && (
                                        <p className="text-xs text-muted-foreground">
                                            {TYPE_INFO[current.type].label}
                                        </p>
                                    )}
                                </div>
                                {current && <StatusPill status={current.status} />}
                            </div>

                            <div className="flex h-[70dvh] flex-col overflow-hidden rounded-xl border border-border">
                                <TicketChat uuid={selected} staffView={false} />
                            </div>
                        </section>
                    )}

                    {signedIn && !selected && (
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h1 className="text-xl font-semibold tracking-tight">Support</h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Chat with the Strata team about your account.
                                    </p>
                                </div>
                                {!composing && (
                                    <button
                                        onClick={() => setComposing(true)}
                                        className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                                    >
                                        <LuPlus className="size-4" />
                                        New request
                                    </button>
                                )}
                            </div>

                            {composing && (
                                <NewRequestForm
                                    signedIn
                                    onCancel={() => setComposing(false)}
                                    onCreated={(uuid) => {
                                        setComposing(false);
                                        setSelected(uuid);
                                        void mutate();
                                    }}
                                />
                            )}

                            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                            {error && <p className="text-sm text-red-500">Couldn't load your requests.</p>}

                            {tickets?.length === 0 && !composing && (
                                <p className="py-12 text-center text-sm text-muted-foreground">
                                    No requests yet. Start one when you need help.
                                </p>
                            )}

                            {tickets && tickets.length > 0 && (
                                <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                                    {tickets.map((t) => (
                                        <li key={t.uuid}>
                                            <button
                                                onClick={() => setSelected(t.uuid)}
                                                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-hover"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{t.subject}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {TYPE_INFO[t.type].label} · {new Date(t.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <StatusPill status={t.status} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}