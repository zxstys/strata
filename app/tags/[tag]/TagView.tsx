// app/tags/[tag]/TagView.tsx
"use client";

import Nav from "@/components/Nav";
import PostCard from "@/components/PostCard";
import { authClient } from "@/lib/auth/auth-client";
import { postClient, refreshPostLists } from "@/lib/post/post-client";
import { useTagFeed } from "@/lib/tags/tag-client";
import type { Post } from "@/types/post";

export default function TagView({ tag }: { tag: string }) {
    const { data: session } = authClient.useSession();
    const { data: posts, error, isLoading } = useTagFeed(tag);

    const likePost = async (post: Post) => {
        try {
            await postClient.like(post.uuid);
            await refreshPostLists();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-xl">
                <Nav session={session} />

                <main className="flex flex-col gap-4 px-4 py-6">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">#{tag}</h1>
                        {posts && (
                            <p className="text-xs text-muted-foreground">
                                {posts.length} {posts.length === 1 ? "post" : "posts"}
                            </p>
                        )}
                    </div>

                    {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                    {error && <p className="text-sm text-red-500">Couldn't load this tag.</p>}

                    {posts?.length === 0 && (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                            No posts with #{tag} yet.
                        </p>
                    )}

                    {posts?.map((post) => (
                        <PostCard key={post.uuid} post={post} onLike={likePost} />
                    ))}
                </main>
            </div>
        </div>
    );
}