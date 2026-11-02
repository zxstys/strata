// app/notifications/page.tsx
"use client";

import Avatar from "@/components/Avatar";
import Nav from "@/components/Nav";
import { VerifiedBadge } from "@/components/UserName";
import { authClient } from "@/lib/auth/auth-client";
import { notifyClient, useNotifications } from "@/lib/notify/notify-client";
import { timeAgo } from "@/lib/time";
import Link from "next/link";
import { useEffect } from "react";

export default function NotificationsPage() {
    const { data: session } = authClient.useSession();
    const { data, error, isLoading } = useNotifications();
    const unread = data?.unread ?? 0;

    // Opening the page marks everything as read. A new notification that arrives
    // while the page is open is also marked read.
    useEffect(() => {
        if (unread > 0) notifyClient.markAllRead().catch(() => { });
    }, [unread]);

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-xl">
                <Nav session={session} />

                <main className="flex flex-col gap-4 px-4 py-6">
                    <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>

                    {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                    {error && <p className="text-sm text-red-500">Couldn't load notifications.</p>}

                    {data?.items.length === 0 && (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                            Nothing yet. When someone mentions you, it will show up here.
                        </p>
                    )}

                    <ul className="divide-y divide-border">
                        {data?.items.map((n) => {
                            if (!n.postUuid) return null;
                            const where = n.commentUuid ? "a reply" : "a post";

                            return (
                                <li key={n.id}>
                                    <Link
                                        href={`/posts/${n.postUuid}`}
                                        className={`flex gap-3 py-4 transition-colors hover:bg-hover ${n.readAt ? "" : "bg-sky-500/5"
                                            }`}
                                    >
                                        <Avatar name={n.actor.name} src={n.actor.image} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm">
                                                <span className="inline-flex items-center gap-1 font-medium">
                                                    {n.actor.name}
                                                    <VerifiedBadge
                                                        verified={n.actor.verified}
                                                        gold={n.actor.gold}
                                                        mod={n.actor.mod}
                                                    />
                                                </span>{" "}
                                                mentioned you in {where}
                                            </p>
                                            {n.preview && (
                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                    {n.preview}
                                                </p>
                                            )}
                                            <time
                                                dateTime={n.createdAt}
                                                className="mt-1 block text-xs text-muted-foreground"
                                            >
                                                {timeAgo(n.createdAt)}
                                            </time>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </main>
            </div>
        </div>
    );
}