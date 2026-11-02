// app/users/[username]/UserProfile.tsx
"use client";

import Avatar from "@/components/Avatar";
import MessageButton from "@/components/dm/MessageButton";
import FollowButton from "@/components/FollowButton";
import Nav from "@/components/Nav";
import PostCard from "@/components/PostCard";
import { VerifiedBadge } from "@/components/UserName";
import { authClient } from "@/lib/auth/auth-client";
import { postClient } from "@/lib/post/post-client";
import { useUser } from "@/lib/user/user-client";
import type { Post } from "@/types/post";
import Link from "next/link";
import { use } from "react";

export default function UserProfile({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = use(params);
    const { data: session } = authClient.useSession();
    const { data, error, isLoading, mutate } = useUser(username);

    const likePost = async (post: Post) => {
        try {
            await postClient.like(post.uuid);
            await mutate();
        } catch (err) {
            console.error(err);
        }
    };

    const handle = data ? data.user.username ?? data.user.id : null;

    const joined = data
        ? new Date(data.user.createdAt).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
        })
        : null;

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-xl">
                <Nav session={session} />

                <main className="flex flex-col gap-6 px-4 py-6">
                    {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

                    {error && (
                        <p className="text-sm text-red-500">User not found or failed to load.</p>
                    )}

                    {data && handle && (
                        <>
                            <section className="flex flex-col">
                                <div className="-mx-4 h-32 overflow-hidden bg-secondary sm:mx-0 sm:rounded-lg">
                                    {data.user.banner && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={data.user.banner}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>

                                <div className="-mt-10 flex items-end justify-between px-1">
                                    <Avatar name={data.user.name} src={data.user.image} size="lg" />

                                    {data.user.isOwner ? (
                                        <Link
                                            href="/settings/profile"
                                            className="mb-1 rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-hover"
                                        >
                                            Edit profile
                                        </Link>
                                    ) : session ? (
                                        <div className="mb-1 flex items-center gap-2">
                                            <MessageButton userId={data.user.id} />
                                            <FollowButton
                                                userId={data.user.id}
                                                following={data.user.isFollowing}
                                                onChanged={() => mutate()}
                                            />
                                        </div>
                                    ) : (
                                        <Link
                                            href="/auth/login"
                                            className="mb-1 rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-hover"
                                        >
                                            Sign in to follow
                                        </Link>
                                    )}
                                </div>

                                <div className="mt-3 flex flex-col gap-1 px-1">
                                    <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
                                        {data.user.name}
                                        <VerifiedBadge
                                            verified={data.user.verified}
                                            gold={data.user.gold}
                                            mod={data.user.mod}
                                        />
                                    </h1>
                                    {data.user.username && (
                                        <p className="font-mono text-sm text-muted-foreground">
                                            @{data.user.username}
                                        </p>
                                    )}
                                    {data.user.about && (
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                                            {data.user.about}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Joined {joined} · {data.posts.length} posts
                                    </p>

                                    <div className="mt-2 flex gap-4 text-sm">
                                        <Link
                                            href={`/users/${handle}/following`}
                                            className="hover:underline"
                                        >
                                            <span className="font-semibold">{data.user.following}</span>{" "}
                                            <span className="text-muted-foreground">Following</span>
                                        </Link>
                                        <Link
                                            href={`/users/${handle}/followers`}
                                            className="hover:underline"
                                        >
                                            <span className="font-semibold">{data.user.followers}</span>{" "}
                                            <span className="text-muted-foreground">Followers</span>
                                        </Link>
                                    </div>
                                </div>
                            </section>

                            <section className="flex flex-col gap-3">
                                {data.posts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No posts yet.</p>
                                ) : (
                                    data.posts.map((post) => (
                                        <PostCard key={post.uuid} post={post} onLike={likePost} />
                                    ))
                                )}
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}