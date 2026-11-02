// lib/notify/notify-client.ts
import { api } from "@/lib/api/api";
import { useApi } from "@/lib/api/use-api";
import type { DmUser } from "@/types/dm";
import { mutate } from "swr";

export type NotificationItem = {
    id: string;
    kind: "mention";
    postUuid: string | null;
    commentUuid: string | null;
    readAt: string | null;
    createdAt: string;
    preview: string;
    actor: DmUser;
};

export type NotificationsResponse = {
    items: NotificationItem[];
    unread: number;
};

export const NOTIFICATIONS_KEY = "/api/notifications";

export const useNotifications = () =>
    useApi<NotificationsResponse>(NOTIFICATIONS_KEY);

export const notifyClient = {
    markAllRead: async () => {
        await api.post(NOTIFICATIONS_KEY);
        await mutate(NOTIFICATIONS_KEY);
    },
};