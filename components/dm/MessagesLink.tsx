// components/dm/MessagesLink.tsx
"use client";

import { INBOX_KEY, useInbox } from "@/lib/dm/dm-client";
import { getRealtime } from "@/lib/dm/realtime-client";
import Link from "next/link";
import { useEffect } from "react";
import { LuMessageSquare } from "react-icons/lu";
import { mutate } from "swr";

export default function MessagesLink({ userId }: { userId: string }) {
    const { data } = useInbox();

    useEffect(() => {
        const channel = getRealtime().subscribe(`private-user-${userId}`);
        const onConversation = () => {
            mutate(INBOX_KEY);
        };
        channel.bind("conversation", onConversation);
        return () => {
            channel.unbind("conversation", onConversation);
        };
    }, [userId]);

    const unread = data?.reduce((n, c) => n + c.unread, 0) ?? 0;

    return (
        <Link
            href="/messages"
            aria-label={unread ? `Messages, ${unread} unread` : "Messages"}
            className="relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        >
            <LuMessageSquare className="size-4" />
            {/* <span className="hidden sm:inline">Messages</span> */}
            {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-sky-500 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                    {unread > 99 ? "99+" : unread}
                </span>
            )}
        </Link>
    );
}