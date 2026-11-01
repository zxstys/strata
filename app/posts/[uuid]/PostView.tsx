// app/posts/[uuid]/PostView.tsx
"use client";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import PostCard from "@/components/PostCard";
import { authClient } from "@/lib/auth/auth-client";
import { postClient, usePost } from "@/lib/post/post-client";
import type { Post } from "@/types/post";
import Link from "next/link";
import { use } from "react";
import { LuArrowLeft } from "react-icons/lu";

import { useState } from "react"; // was: import { use } from "react"; (remove this line if it only had use)

export default function PostView({
    uuid,
    initial,
}: {
    uuid: string;
    initial: Post | null;
}) {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const { data: post, error, isLoading, mutate } = usePost(uuid, initial);

    const likePost = async (p: Post) => {
        try {
            await postClient.like(p.uuid);
            await mutate();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-xl">
                <Nav session={session} />

                <div className="flex items-center gap-4 border-b border-border px-4 py-3">
                    <Link
                        href="/"
                        aria-label="Back to feed"
                        className="rounded-full p-2 text-muted-foreground hover:bg-hover hover:text-foreground"
                    >
                        <LuArrowLeft />
                    </Link>
                    <h1 className="text-base font-semibold">Post</h1>
                </div>

                <main className="px-4 py-4">
                    {isLoading && (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    )}

                    {error && (
                        <div className="py-12 text-center">
                            <p className="text-sm font-medium">This post doesn't exist</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                It may have been deleted.
                            </p>
                        </div>
                    )}

                    {post && (
                        <PostCard
                            post={post}
                            onLike={likePost}
                            expanded
                            onDeleted={() => router.push("/")}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}