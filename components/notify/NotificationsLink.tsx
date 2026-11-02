// components/notify/NotificationsLink.tsx
"use client";

import { getRealtime } from "@/lib/dm/realtime-client";
import {
    NOTIFICATIONS_KEY,
    useNotifications,
} from "@/lib/notify/notify-client";
import Link from "next/link";
import { useEffect } from "react";
import { LuBell } from "react-icons/lu";
import { mutate } from "swr";

export default function NotificationsLink({ userId }: { userId: string }) {
    const { data } = useNotifications();

    useEffect(() => {
        const channel = getRealtime().subscribe(`private-user-${userId}`);
        const onNotification = () => {
            mutate(NOTIFICATIONS_KEY);
        };
        channel.bind("notification", onNotification);
        return () => {
            channel.unbind("notification", onNotification);
        };
    }, [userId]);

    const unread = data?.unread ?? 0;

    return (
        <Link
            href="/notifications"
            aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
            className="relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        >
            <LuBell className="size-4" />
            {/* <span className="hidden sm:inline">Notifications</span> */}
            {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-sky-500 px-1 text-center text-[10px] font-semibold leading-4 text-white">
                    {unread > 99 ? "99+" : unread}
                </span>
            )}
        </Link>
    );
}