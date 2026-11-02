// components/admin/UserAccessPanel.tsx
"use client";

import TicketChat from "@/components/support/TicketChat";
import { api } from "@/lib/api/api";
import { TYPE_INFO } from "@/lib/support/support";
import { supportClient, useUserTickets } from "@/lib/support/support-client";
import type { AdminUser } from "@/types/admin";
import { useState } from "react";
import StatusPill from "../status/StatusPill";

type Role = "user" | "mod" | "admin";

export default function UserAccessPanel({
    user,
    onChanged,
}: {
    user: AdminUser;
    onChanged: () => Promise<unknown>;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [openTicket, setOpenTicket] = useState<string | null>(null);

    const { data: tickets, mutate: refreshTickets } = useUserTickets(user.id);

    const run = async (task: () => Promise<unknown>) => {
        setBusy(true);
        setError("");
        try {
            await task();
            await Promise.all([onChanged(), refreshTickets()]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't save.");
        } finally {
            setBusy(false);
        }
    };

    const patch = (body: Record<string, unknown>) =>
        run(() => api.patch("/api/admin/users", { userId: user.id, ...body }));

    const approve = (uuid: string, grantLabel: string) =>
        run(() =>
            supportClient.update({
                uuid,
                status: "resolved",
                grant: true,
                adminNote: `${grantLabel} approved.`,
            })
        );

    return (
        <div className="flex flex-col gap-5 border-t border-border bg-secondary/40 p-4">
            <section className="grid gap-3 sm:grid-cols-3">
                <Switch
                    label="Blue checkmark"
                    hint="Verified by Strata"
                    on={user.verified}
                    disabled={busy}
                    onToggle={() => patch({ verified: !user.verified })}
                />
                <Switch
                    label="Gold access"
                    hint="Lets the user show gold"
                    on={user.goldPermission}
                    disabled={busy}
                    onToggle={() => patch({ goldPermission: !user.goldPermission })}
                />
                <label className="flex flex-col justify-center gap-1.5 rounded-lg border border-border bg-background p-3">
                    <span className="text-sm font-medium">Role</span>
                    <select
                        aria-label={`Role for ${user.name}`}
                        value={(user.role ?? "user") as Role}
                        disabled={busy}
                        onChange={(e) => patch({ role: e.target.value })}
                        className="h-8 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50"
                    >
                        <option value="user">User</option>
                        <option value="mod">Moderator</option>
                        <option value="admin">Admin</option>
                    </select>
                </label>
            </section>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">Requests from this user</h3>

                {!tickets && <p className="text-sm text-muted-foreground">Loading...</p>}
                {tickets?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No requests.</p>
                )}

                <ul className="flex flex-col gap-2">
                    {tickets?.map((t) => {
                        const info = TYPE_INFO[t.type];
                        const open = openTicket === t.uuid;

                        return (
                            <li key={t.uuid} className="overflow-hidden rounded-lg border border-border bg-background">
                                <div className="flex flex-col gap-2 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-sm font-medium">{t.subject}</p>
                                        <StatusPill status={t.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {info.label} · {new Date(t.createdAt).toLocaleDateString()}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setOpenTicket(open ? null : t.uuid)}
                                            className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-hover"
                                        >
                                            {open ? "Hide chat" : "Open chat"}
                                        </button>

                                        {info.grantLabel && t.status !== "resolved" && (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => approve(t.uuid, info.grantLabel!)}
                                                className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                                            >
                                                {info.grantLabel}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {open && (
                                    <div className="h-96 border-t border-border">
                                        <TicketChat uuid={t.uuid} staffView />
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}

function Switch({
    label,
    hint,
    on,
    disabled,
    onToggle,
}: {
    label: string;
    hint: string;
    on: boolean;
    disabled: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
            <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={label}
                disabled={disabled}
                onClick={onToggle}
                className={`relative inline-block h-6 w-11 shrink-0 rounded-full p-0 transition-colors disabled:opacity-50 ${on ? "bg-sky-500" : "bg-secondary ring-1 ring-border"
                    }`}
            >
                <span
                    className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-0"
                        }`}
                />
            </button>
        </div>
    );
}