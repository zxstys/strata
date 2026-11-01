// app/users/[username]/[tab]/ConnectionsView.tsx
"use client";

import Avatar from "@/components/Avatar";
import Nav from "@/components/Nav";
import { UserName } from "@/components/UserName";
import { authClient } from "@/lib/auth/auth-client";
import { fetcher } from "@/lib/api/fetcher";
import Link from "next/link";
import { use } from "react";
import useSWR from "swr";

type Row = {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    verified: boolean;
    gold: boolean;
};

export default function ConnectionsView({
    params,
}: {
    params: Promise<{ username: string; tab: string }>;
}) {
    const { username, tab } = use(params);
    const { data: session } = authClient.useSession();

    const valid = tab === "followers" || tab === "following";
    const ready = valid && username.trim().length > 0;

    const { data, error, isLoading } = useSWR<Row[]>(
        ready
            ? `/api/follows?user=${encodeURIComponent(username.trim())}&type=${tab}`
            : null,
        fetcher
    );

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-xl">
                <Nav session={session} />

                <main className="flex flex-col gap-4 px-4 py-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/users/${username}`}
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            ← Back to profile
                        </Link>
                    </div>

                    {!valid && (
                        <p className="text-sm text-muted-foreground">Page not found.</p>
                    )}

                    {valid && (
                        <h1 className="text-xl font-semibold tracking-tight capitalize">
                            {tab}
                        </h1>
                    )}

                    {valid && isLoading && (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    )}

                    {valid && error && (
                        <p className="text-sm text-red-500">Couldn't load this list.</p>
                    )}

                    {valid && data?.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            {tab === "followers" ? "No followers yet." : "Not following anyone yet."}
                        </p>
                    )}

                    {valid && data && data.length > 0 && (
                        <ul className="divide-y divide-border rounded-lg border border-border">
                            {data.map((u) => (
                                <li key={u.id} className="flex items-center gap-3 p-4">
                                    <Link
                                        href={`/users/${u.username ?? u.id}`}
                                        aria-label={`${u.name}'s profile`}
                                        className="rounded-full transition-opacity hover:opacity-80"
                                    >
                                        <Avatar name={u.name} src={u.image} />
                                    </Link>
                                    <div className="min-w-0">
                                        <UserName author={u} />
                                        {u.username && (
                                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </main>
            </div>
        </div>
    );
}