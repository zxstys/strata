// app/admin/posts/page.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import Avatar from "@/components/Avatar";
import Pager from "@/components/admin/Pager";
import { adminFetch } from "@/lib/admin-client";
import { fetcher } from "@/lib/fetcher";
import type { Post } from "@/types/post";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

type PostsResponse = { posts: Post[]; hasMore: boolean };

export default function AdminPosts() {
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    const key = `/api/admin/posts?q=${encodeURIComponent(q)}&page=${page}`;
    const { data, error, isLoading, mutate } = useSWR<PostsResponse>(key, fetcher, {
        keepPreviousData: true,
    });

    const changeQuery = (value: string) => {
        setQ(value);
        setPage(1);
    };

    const remove = async (p: Post) => {
        if (!confirm("Delete this post? Its likes and replies will be removed too.")) return;

        setBusyId(p.uuid);
        setMessage("");
        try {
            await adminFetch("/api/admin/posts", "DELETE", { uuid: p.uuid });
            await mutate();
            setMessage("Post deleted.");
        } catch (err) {
            setMessage(err instanceof Error ? err.message : "Delete failed.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <input
                value={q}
                onChange={(e) => changeQuery(e.target.value)}
                placeholder="Search post text or @username"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />

            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            {error && <p className="text-sm text-red-500">{error.message}</p>}
            {isLoading && !data && <p className="text-sm text-muted-foreground">Loading...</p>}
            {data?.posts.length === 0 && (
                <p className="text-sm text-muted-foreground">No posts found.</p>
            )}

            <ul className="divide-y divide-border rounded-lg border border-border">
                {data?.posts.map((p) => (
                    <li key={p.uuid} className="flex gap-3 p-4">
                        <Avatar name={p.author.name} src={p.author.image} />

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 text-sm">
                                <span className="font-medium">{p.author.name}</span>
                                {p.author.username && (
                                    <span className="text-muted-foreground">@{p.author.username}</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    · {new Date(p.createdAt).toLocaleString()}
                                </span>
                            </div>

                            <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm">
                                {p.content || <em className="text-muted-foreground">(image only)</em>}
                            </p>

                            {p.mediaUrl && (
                                <img
                                    src={p.mediaUrl}
                                    alt=""
                                    loading="lazy"
                                    className="mt-2 max-h-40 rounded-lg border border-border object-cover"
                                />
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span>{p.likes} likes</span>
                                <span>{p.comments} replies</span>
                                <Link href={`/posts/${p.uuid}`} className="hover:underline">
                                    Open
                                </Link>
                                <button
                                    onClick={() => remove(p)}
                                    disabled={busyId === p.uuid}
                                    className="ml-auto text-destructive hover:underline disabled:opacity-50"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {data && <Pager page={page} hasMore={data.hasMore} onChange={setPage} />}
        </div>
    );
}