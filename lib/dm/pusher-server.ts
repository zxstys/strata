// lib/dm/pusher-server.ts
import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const convChannel = (id: string) => `private-conv-${id}`;
export const userChannel = (id: string) => `private-user-${id}`;
export const ticketChannel = (id: string) => `private-ticket-${id}`;

// Staff only: new requests and new user replies.
export const STAFF_CHANNEL = "private-staff";

// Realtime is best-effort. The data is already saved when this runs.
export async function push(channel: string, event: string, data: unknown) {
  try {
    await pusher.trigger(channel, event, data);
  } catch (err) {
    console.error("[pusher]", err);
  }
}