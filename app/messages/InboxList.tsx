// app/messages/InboxList.tsx
"use client";

import Avatar from "@/components/Avatar";
import { VerifiedBadge } from "@/components/UserName";
import { authClient } from "@/lib/auth/auth-client";
import { useInbox } from "@/lib/dm/dm-client";
import { timeAgo } from "@/lib/time";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function InboxList() {
    const { data: session } = authClient.useSession();
    const { data, error, isLoading } = useInbox();
    const pathname = usePathname();
    const meId = session?.user.id;

    return (
        <>
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">Messages</div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {isLoading && <p className="px-4 py-3 text-sm text-muted-foreground">Loading...</p>}
                {error && <p className="px-4 py-3 text-sm text-red-500">Couldn't load messages.</p>}

                {data?.length === 0 && (
                    <p className="px-4 py-6 text-sm text-muted-foreground">
                        No conversations yet. Open someone's profile and press Message.
                    </p>
                )}

                {data?.map((c) => {
                    const active = pathname === `/messages/${c.id}`;
                    const preview = c.lastMessage
                        ? `${c.lastMessage.senderId === meId ? "You: " : ""}${c.lastMessage.content || "Sent a photo"}`
                        : "No messages yet";

                    return (
                        <Link
                            key={c.id}
                            href={`/messages/${c.id}`}
                            className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover ${active ? "bg-secondary" : ""
                                }`}
                        >
                            <Avatar name={c.other.name} src={c.other.image} />

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex min-w-0 items-center gap-1 truncate text-sm font-medium">
                                        {c.other.name}
                                        <VerifiedBadge
                                            verified={c.other.verified}
                                            gold={c.other.gold}
                                            mod={c.other.mod}
                                        />
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                        {timeAgo(c.lastMessageAt)}
                                    </span>
                                </div>
                                <p
                                    className={`truncate text-xs ${c.unread ? "font-medium text-foreground" : "text-muted-foreground"
                                        }`}
                                >
                                    {preview}
                                </p>
                            </div>

                            {c.unread > 0 && (
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sky-500 text-[10px] font-semibold text-white">
                                    {c.unread > 9 ? "9+" : c.unread}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </>
    );
}