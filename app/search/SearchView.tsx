// app/search/SearchView.tsx
"use client";

import Avatar from "@/components/Avatar";
import Nav from "@/components/Nav";
import PostCard from "@/components/PostCard";
import { UserName } from "@/components/UserName";
import { authClient } from "@/lib/auth/auth-client";
import { postClient } from "@/lib/post/post-client";
import { profilePath } from "@/lib/post/profile-link";
import { useSearch } from "@/lib/post/search-client";
import type { Post } from "@/types/post";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type Tab = "people" | "posts";

export default function SearchView() {
    const params = useSearchParams();
    const q = (params.get("q") ?? "").trim();
    const { data: session } = authClient.useSession();
    const { data, error, isLoading, mutate } = useSearch(q);
    const [tab, setTab] = useState<Tab>("people");

    const people = data?.users ?? [];
    const posts = data?.posts ?? [];

    const likePost = async (post: Post) => {
        try {
            await postClient.like(post.uuid);
            await mutate();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-xl">
                <Nav session={session} />

                <main className="flex flex-col gap-4 px-4 py-6">
                    {!q && (
                        <p className="text-sm text-muted-foreground">
                            Use the search bar above to find people and posts.
                        </p>
                    )}

                    {q && (
                        <>
                            <h1 className="text-lg font-semibold tracking-tight">
                                Results for “{q}”
                            </h1>

                            <div className="flex gap-6 border-b border-border">
                                {(["people", "posts"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTab(t)}
                                        className={`border-b-2 pb-2 text-sm capitalize transition-colors ${tab === t
                                            ? "border-foreground font-medium text-foreground"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {t} ({t === "people" ? people.length : posts.length})
                                    </button>
                                ))}
                            </div>

                            {isLoading && !data && (
                                <p className="text-sm text-muted-foreground">Searching...</p>
                            )}
                            {error && <p className="text-sm text-red-500">Search failed.</p>}

                            {tab === "people" &&
                                (people.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No people found.</p>
                                ) : (
                                    <ul className="divide-y divide-border rounded-lg border border-border">
                                        {people.map((u) => (
                                            <li key={u.id} className="flex items-center gap-3 p-4">
                                                <Avatar name={u.name} src={u.image} />
                                                <div className="min-w-0">
                                                    <UserName author={u} />
                                                    {u.username && (
                                                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                                                    )}
                                                </div>
                                                <a
                                                    href={profilePath(u)}
                                                    className="ml-auto text-sm text-muted-foreground hover:text-foreground"
                                                >
                                                    View
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ))}

                            {tab === "posts" &&
                                (posts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No posts found.</p>
                                ) : (
                                    posts.map((post) => (
                                        <PostCard key={post.uuid} post={post} onLike={likePost} />
                                    ))
                                ))}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}