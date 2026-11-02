// lib/dm/dm-client.ts
import { api } from "@/lib/api/api";
import { useApi } from "@/lib/api/use-api";
import type { DmInboxItem, DmMessage, DmThread, LocalMessage } from "@/types/dm";
import { mutate } from "swr";

export const INBOX_KEY = "/api/dm/conversations";
export const threadKey = (id: string) => `/api/dm/conversations/${id}`;

export const useInbox = () => useApi<DmInboxItem[]>(INBOX_KEY);

export const useThread = (id: string | null) =>
    useApi<DmThread>(id ? threadKey(id) : null, { revalidateOnFocus: false });

export const dmClient = {
    open: (userId: string) => api.post<{ id: string }>(INBOX_KEY, { userId }),
    send: (id: string, input: { uuid: string; content: string; mediaUrl: string | null }) =>
        api.post<DmMessage>(`${threadKey(id)}/messages`, input),
    markRead: async (id: string) => {
        await api.post(`${threadKey(id)}/read`);
        await mutate(INBOX_KEY);
    },
};

// Updates a cached thread without refetching it.
export function patchThread(id: string, update: (t: DmThread) => DmThread) {
    return mutate<DmThread>(threadKey(id), (prev) => (prev ? update(prev) : prev), {
        revalidate: false,
    });
}

// Adds a message, or replaces it if the uuid is already there (the sender's
// own message arrives both from the HTTP response and from the channel).
export function upsertMessage(thread: DmThread, msg: LocalMessage): DmThread {
    const exists = thread.messages.some((m) => m.uuid === msg.uuid);
    return {
        ...thread,
        messages: exists
            ? thread.messages.map((m) => (m.uuid === msg.uuid ? msg : m))
            : [...thread.messages, msg],
    };
}