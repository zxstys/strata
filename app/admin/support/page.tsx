// app/admin/support/page.tsx
"use client";

import Avatar from "@/components/Avatar";
import { authClient } from "@/lib/auth/auth-client";
import { isAdmin } from "@/lib/user/roles";
import { supportClient, useQueue } from "@/lib/support/support-client";
import { TICKET_STATUSES, TYPE_INFO, type TicketStatus } from "@/lib/support/support";
import type { QueueTicket } from "@/types/support";
import { useState } from "react";
import StatusPill from "@/components/status/StatusPill";

const FILTERS = [
    { value: "open", label: "Open" },
    { value: "resolved", label: "Resolved" },
    { value: "all", label: "All" },
] as const;

export default function SupportQueue() {
    const { data: session } = authClient.useSession();
    const admin = isAdmin(session?.user.role);
    const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("open");
    const { data, error, isLoading, mutate } = useQueue(filter);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        aria-pressed={filter === f.value}
                        onClick={() => setFilter(f.value)}
                        className={`rounded-full px-3 py-1 text-sm transition-colors ${filter === f.value
                                ? "bg-primary text-primary-foreground"
                                : "border border-border text-muted-foreground hover:bg-hover"
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {error && <p className="text-sm text-red-500">Couldn't load requests.</p>}
            {data?.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing here right now.</p>
            )}

            <ul className="flex flex-col gap-3">
                {data?.map((t) => (
                    <TicketRow key={t.uuid} ticket={t} admin={admin} onChanged={() => mutate()} />
                ))}
            </ul>
        </div>
    );
}

function TicketRow({
    ticket,
    admin,
    onChanged,
}: {
    ticket: QueueTicket;
    admin: boolean;
    onChanged: () => Promise<unknown>;
}) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState<TicketStatus>(ticket.status);
    const [note, setNote] = useState(ticket.adminNote ?? "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const info = TYPE_INFO[ticket.type];
    const email = ticket.contactEmail ?? ticket.user?.email ?? null;
    const who = ticket.user
        ? `${ticket.user.name}${ticket.user.username ? ` · @${ticket.user.username}` : ""}`
        : ticket.contactEmail ?? "Unknown";

    const canGrant =
        admin && Boolean(info.grantLabel) && Boolean(ticket.user) && ticket.status !== "resolved";

    const save = async (grant = false) => {
        setBusy(true);
        setError("");
        try {
            await supportClient.update({
                uuid: ticket.uuid,
                status: grant ? "resolved" : status,
                adminNote: note,
                grant,
            });
            await onChanged();
            setOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't save.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <li className="rounded-lg border border-border p-4">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-start gap-3 text-left"
            >
                <Avatar name={ticket.user?.name ?? "?"} src={ticket.user?.image ?? null} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{ticket.subject}</p>
                        <StatusPill status={ticket.status} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                        {info.label} · {who} · {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                </div>
            </button>

            {open && (
                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                    <p className="whitespace-pre-wrap text-sm">{ticket.message}</p>

                    {ticket.user && (
                        <p className="text-xs text-muted-foreground">
                            Role: {ticket.user.role ?? "user"} · Verified: {ticket.user.verified ? "yes" : "no"} ·
                            Gold access: {ticket.user.goldPermission ? "yes" : "no"}
                        </p>
                    )}

                    {email && (
                        <a
                            href={`mailto:${email}?subject=${encodeURIComponent(`Re: ${ticket.subject}`)}`}
                            className="w-fit text-sm font-medium text-primary underline underline-offset-2"
                        >
                            Reply by email
                        </a>
                    )}

                    <label className="flex flex-col gap-1.5 text-sm">
                        Status
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as TicketStatus)}
                            className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                        >
                            {TICKET_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s === "rejected" ? "declined" : s.replace("_", " ")}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                        Note to user
                        <textarea
                            value={note}
                            maxLength={1000}
                            rows={3}
                            onChange={(e) => setNote(e.target.value)}
                            className="resize-none rounded-md border border-border bg-background p-2 text-sm"
                        />
                    </label>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex flex-wrap justify-end gap-2">
                        {canGrant && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => save(true)}
                                className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                            >
                                {info.grantLabel}
                            </button>
                        )}
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => save(false)}
                            className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-hover disabled:opacity-50"
                        >
                            {busy ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            )}
        </li>
    );
}