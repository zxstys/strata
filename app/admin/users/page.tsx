// app/admin/users/page.tsx
"use client";

import Avatar from "@/components/Avatar";
import Pager from "@/components/admin/Pager";
import UserAccessPanel from "@/components/admin/UserAccessPanel";
import { useApi } from "@/lib/api/use-api";
import type { AdminUser } from "@/types/admin";
import type { ReactNode } from "react";
import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";

type UsersResponse = { users: AdminUser[]; hasMore: boolean; page: number };

export default function AdminUsers() {
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState<string | null>(null);

    const key = `/api/admin/users?q=${encodeURIComponent(q)}&page=${page}`;
    const { data, error, isLoading, mutate } = useApi<UsersResponse>(key, {
        keepPreviousData: true,
    });

    const changeQuery = (value: string) => {
        setQ(value);
        setPage(1);
        setOpenId(null);
    };

    return (
        <div className="flex flex-col gap-4">
            <input
                value={q}
                onChange={(e) => changeQuery(e.target.value)}
                placeholder="Search name, username, or email"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />

            {error && <p className="text-sm text-red-500">{error.message}</p>}
            {isLoading && !data && <p className="text-sm text-muted-foreground">Loading...</p>}
            {data?.users.length === 0 && (
                <p className="text-sm text-muted-foreground">No users found.</p>
            )}

            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {data?.users.map((u) => {
                    const open = openId === u.id;

                    return (
                        <li key={u.id}>
                            <div className="flex items-center gap-3 p-4">
                                <Avatar name={u.name} src={u.image} />

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="truncate text-sm font-medium">{u.name}</span>
                                        {u.role === "admin" && <Tag tone="primary">Admin</Tag>}
                                        {u.role === "mod" && <Tag tone="gradient">Mod</Tag>}
                                        {u.verified && <Tag tone="sky">Blue</Tag>}
                                        {u.goldPermission && <Tag tone="amber">Gold</Tag>}
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {u.username ? `@${u.username}` : "no username"} · {u.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {u.postCount} posts · joined {new Date(u.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    aria-expanded={open}
                                    onClick={() => setOpenId(open ? null : u.id)}
                                    className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-hover"
                                >
                                    Manage
                                    <LuChevronDown
                                        className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                                    />
                                </button>
                            </div>

                            {open && <UserAccessPanel user={u} onChanged={() => mutate()} />}
                        </li>
                    );
                })}
            </ul>

            {data && <Pager page={page} hasMore={data.hasMore} onChange={setPage} />}
        </div>
    );
}

function Tag({
    tone,
    children,
}: {
    tone: "primary" | "gradient" | "sky" | "amber";
    children: ReactNode;
}) {
    const styles = {
        primary: "bg-primary text-primary-foreground",
        gradient: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
        sky: "bg-sky-500/10 text-sky-600",
        amber: "bg-amber-500/10 text-amber-600",
    } as const;

    return (
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${styles[tone]}`}>
            {children}
        </span>
    );
}