// lib/dm/realtime-client.ts
import Pusher from "pusher-js";

let client: Pusher | null = null;

// One connection for the whole app. Private channels authorize via /api/pusher/auth.
export function getRealtime(): Pusher {
    if (!client) {
        client = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
        });
    }
    return client;
}