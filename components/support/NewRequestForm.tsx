// components/support/NewRequestForm.tsx
"use client";

import { supportClient } from "@/lib/support/support-client";
import { TICKET_TYPES, TYPE_INFO, type TicketType } from "@/lib/support/support";
import { useState } from "react";

const inputClass =
    "rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function NewRequestForm({
    signedIn,
    onCreated,
    onCancel,
}: {
    signedIn: boolean;
    onCreated: (uuid: string) => void;
    onCancel?: () => void;
}) {
    const types = TICKET_TYPES.filter((t) => signedIn || !TYPE_INFO[t].signedInOnly);

    const [type, setType] = useState<TicketType | null>(null);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!type) return;

        setBusy(true);
        setError("");
        try {
            const { uuid } = await supportClient.create({
                type,
                subject: subject.trim(),
                message: message.trim(),
                contactEmail: signedIn ? undefined : email.trim(),
            });
            setType(null);
            setSubject("");
            setMessage("");
            setEmail("");
            onCreated(uuid);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't send your request.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-border p-4">
            <div className="grid gap-2 sm:grid-cols-2">
                {types.map((t) => (
                    <button
                        key={t}
                        type="button"
                        aria-pressed={type === t}
                        onClick={() => setType(t)}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${type === t ? "border-foreground bg-secondary" : "border-border hover:bg-hover"
                            }`}
                    >
                        <span className="text-sm font-medium">{TYPE_INFO[t].label}</span>
                        <span className="text-xs text-muted-foreground">{TYPE_INFO[t].description}</span>
                    </button>
                ))}
            </div>

            {type && (
                <>
                    <label className="flex flex-col gap-1.5 text-sm font-medium">
                        Subject
                        <input
                            required
                            value={subject}
                            maxLength={120}
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
                            rows={4}
                            value={message}
                            maxLength={2000}
                            onChange={(e) => setMessage(e.target.value)}
                            className={`resize-none p-3 font-normal ${inputClass}`}
                        />
                    </label>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <div className="flex items-center justify-between">
                        {onCancel ? (
                            <button type="button" onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
                                Cancel
                            </button>
                        ) : (
                            <span />
                        )}
                        <button
                            type="submit"
                            disabled={busy}
                            className="rounded-full bg-primary px-5 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {busy ? "Sending..." : "Send"}
                        </button>
                    </div>
                </>
            )}
        </form>
    );
}