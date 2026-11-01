// app/support/page.tsx
"use client";

import Nav from "@/components/Nav";
import { supportClient, useMyTickets } from "@/lib/support/support-client";
import { TICKET_TYPES, TYPE_INFO, type TicketType } from "@/lib/support/support";
import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import StatusPill from "@/components/status/StatusPill";

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 2000;

const inputClass =
    "rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function SupportPage() {
    const { data: session, isPending } = authClient.useSession();
    const signedIn = Boolean(session);
    const { data: tickets, mutate } = useMyTickets(signedIn);

    const [type, setType] = useState<TicketType | null>(null);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!type) return;

        setBusy(true);
        setNotice(null);
        try {
            await supportClient.create({
                type,
                subject: subject.trim(),
                message: message.trim(),
                contactEmail: signedIn ? undefined : email.trim(),
            });
            setType(null);
            setSubject("");
            setMessage("");
            setEmail("");
            setNotice({ ok: true, text: "Request sent. We'll get back to you soon." });
            if (signedIn) await mutate();
        } catch (err) {
            setNotice({
                ok: false,
                text: err instanceof Error ? err.message : "Couldn't send your request.",
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-xl">
                <Nav session={session} />

                <main className="flex flex-col gap-8 px-4 py-6">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">Support</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Account recovery, verification, and role requests.
                        </p>
                    </div>

                    <section className="flex flex-col gap-3">
                        <h2 className="text-sm font-medium">What do you need?</h2>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {TICKET_TYPES.map((t) => {
                                const info = TYPE_INFO[t];
                                const locked = info.signedInOnly && !signedIn;
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        disabled={locked || isPending}
                                        aria-pressed={type === t}
                                        onClick={() => setType(t)}
                                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors disabled:opacity-50 ${type === t
                                                ? "border-foreground bg-secondary"
                                                : "border-border hover:bg-hover"
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{info.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {locked ? "Sign in required" : info.description}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {type && (
                        <form
                            onSubmit={submit}
                            className="flex flex-col gap-3 rounded-lg border border-border p-4"
                        >
                            <label className="flex flex-col gap-1.5 text-sm font-medium">
                                Subject
                                <input
                                    required
                                    value={subject}
                                    maxLength={SUBJECT_MAX}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className={`h-10 font-normal ${inputClass}`}
                                />
                            </label>

                            {!signedIn && (
                                <label className="flex flex-col gap-1.5 text-sm font-medium">
                                    Your email
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="So we can reply"
                                        className={`h-10 font-normal ${inputClass}`}
                                    />
                                </label>
                            )}

                            <label className="flex flex-col gap-1.5 text-sm font-medium">
                                Details
                                <textarea
                                    required
                                    rows={5}
                                    value={message}
                                    maxLength={MESSAGE_MAX}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={
                                        type === "account_recovery"
                                            ? "Tell us your username or the email on the account, and what happened."
                                            : "Tell us what you need and why."
                                    }
                                    className={`resize-none p-3 font-normal ${inputClass}`}
                                />
                                <span className="self-end text-xs font-normal text-muted-foreground">
                                    {message.length}/{MESSAGE_MAX}
                                </span>
                            </label>

                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setType(null)}
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={busy}
                                    className="rounded-full bg-primary px-5 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                >
                                    {busy ? "Sending..." : "Send request"}
                                </button>
                            </div>
                        </form>
                    )}

                    {notice && (
                        <p
                            role="status"
                            className={`text-sm ${notice.ok ? "text-muted-foreground" : "text-red-500"}`}
                        >
                            {notice.text}
                        </p>
                    )}

                    {signedIn && (
                        <section className="flex flex-col gap-3">
                            <h2 className="text-sm font-medium">My requests</h2>

                            {tickets?.length === 0 && (
                                <p className="text-sm text-muted-foreground">No requests yet.</p>
                            )}

                            <ul className="divide-y divide-border rounded-lg border border-border">
                                {tickets?.map((t) => (
                                    <li key={t.uuid} className="flex flex-col gap-1 p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium">{t.subject}</p>
                                            <StatusPill status={t.status} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {TYPE_INFO[t.type].label} · {new Date(t.createdAt).toLocaleDateString()}
                                        </p>
                                        {t.adminNote && (
                                            <p className="mt-1 text-sm">
                                                <span className="text-muted-foreground">Response: </span>
                                                {t.adminNote}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
}