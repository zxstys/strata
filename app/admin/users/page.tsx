// app/admin/users/page.tsx
"use client";

import Avatar from "@/components/Avatar";
import Pager from "@/components/admin/Pager";
import { adminFetch } from "@/lib/admin-client";
import { fetcher } from "@/lib/fetcher";
import type { AdminUser } from "@/types/admin";
import { useState } from "react";
import useSWR from "swr";

type UsersResponse = { users: AdminUser[]; hasMore: boolean; page: number };

const BTN =
    "rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-hover disabled:opacity-50";

const pill = (on: boolean) =>
    `${BTN} ${on ? "border-transparent bg-primary text-primary-foreground hover:bg-primary hover:opacity-90" : "text-muted-foreground"}`;

export default function AdminUsers() {
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    const key = `/api/admin/users?q=${encodeURIComponent(q)}&page=${page}`;
    const { data, error, isLoading, mutate } = useSWR<UsersResponse>(key, fetcher, {
        keepPreviousData: true,
    });

    const changeQuery = (value: string) => {
        setQ(value);
        setPage(1);
    };

    const update = async (u: AdminUser, body: Record<string, unknown>, success: string) => {
        setBusyId(u.id);
        setMessage("");
        try {
            await adminFetch("/api/admin/users", "PATCH", { userId: u.id, ...body });
            await mutate();
            setMessage(success);
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Update failed.");
        } finally {
            setBusyId(null);
        }
    };

    const toggleAdmin = (u: AdminUser) => {
        const makeAdmin = u.role !== "admin";
        if (!makeAdmin && !confirm(`Remove admin access from ${u.name}?`)) return;
        update(u, { role: makeAdmin ? "admin" : "user" }, makeAdmin ? "Admin granted." : "Admin removed.");
    };

    return (
        <div className="flex flex-col gap-4">
            <input
                value={q}
                onChange={(e) => changeQuery(e.target.value)}
                placeholder="Search name, username, or email"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />

            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            {error && <p className="text-sm text-red-500">{error.message}</p>}
            {isLoading && !data && <p className="text-sm text-muted-foreground">Loading...</p>}
            {data?.users.length === 0 && (
                <p className="text-sm text-muted-foreground">No users found.</p>
            )}

            <ul className="divide-y divide-border rounded-lg border border-border">
                {data?.users.map((u) => (
                    <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Avatar name={u.name} src={u.image} />
                            <div className="min-w-0">
                                <p className="flex items-center gap-2 truncate text-sm font-medium">
                                    {u.name}
                                    {u.role === "admin" && (
                                        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                                            Admin
                                        </span>
                                    )}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {u.username ? `@${u.username}` : "no username"} · {u.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {u.postCount} posts · joined {new Date(u.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                aria-pressed={u.role === "admin"}
                                disabled={busyId === u.id}
                                onClick={() => toggleAdmin(u)}
                                className={pill(u.role === "admin")}
                            >
                                Admin
                            </button>
                            <button
                                aria-pressed={u.verified}
                                disabled={busyId === u.id}
                                onClick={() =>
                                    update(u, { verified: !u.verified }, u.verified ? "Verification removed." : "Verified.")
                                }
                                className={pill(u.verified)}
                            >
                                Verified
                            </button>
                            <button
                                aria-pressed={u.goldPermission}
                                disabled={busyId === u.id}
                                onClick={() =>
                                    update(
                                        u,
                                        { goldPermission: !u.goldPermission },
                                        u.goldPermission ? "Gold access removed." : "Gold access granted."
                                    )
                                }
                                className={pill(u.goldPermission)}
                            >
                                Gold access
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {data && (
                <Pager page={page} hasMore={data.hasMore} onChange={setPage} />
            )}
        </div>
    );
}