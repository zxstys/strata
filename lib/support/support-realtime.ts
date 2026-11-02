// lib/support/support-realtime.ts
"use client";

import { getRealtime } from "@/lib/dm/realtime-client";
import { useEffect, useRef } from "react";

// Binds one event on one channel. Only unbinds on cleanup. The channel stays
// subscribed, because other components (the nav, for example) may use it too.
function useChannelEvent(
    channelName: string | null,
    event: string,
    handler: () => void
) {
    const latest = useRef(handler);

    useEffect(() => {
        latest.current = handler;
    });

    useEffect(() => {
        if (!channelName) return;

        const channel = getRealtime().subscribe(channelName);
        const listener = () => latest.current();
        channel.bind(event, listener);

        return () => {
            channel.unbind(event, listener);
        };
    }, [channelName, event]);
}

export function useTicketLive(uuid: string | null, onMessage: () => void) {
    useChannelEvent(uuid ? `private-ticket-${uuid}` : null, "message", onMessage);
}

export function useUserSupportLive(userId: string | null, onChange: () => void) {
    useChannelEvent(userId ? `private-user-${userId}` : null, "support", onChange);
}

export function useStaffLive(enabled: boolean, onChange: () => void) {
    useChannelEvent(enabled ? "private-staff" : null, "ticket", onChange);
}