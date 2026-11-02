// lib/support/support-client.ts
import { api } from "@/lib/api/api";
import { useApi } from "@/lib/api/use-api";
import type { TicketStatus, TicketType } from "@/lib/support/support";
import type { MyTicket, QueueTicket, SupportMessage, TicketDetail } from "@/types/support";

export const useMyTickets = (enabled: boolean) =>
    useApi<MyTicket[]>(enabled ? "/api/support" : null);

export const useQueue = (filter: string) =>
    useApi<QueueTicket[]>(`/api/support/queue?status=${filter}`);

export const useUserTickets = (userId: string) =>
    useApi<QueueTicket[]>(
        `/api/support/queue?status=all&userId=${encodeURIComponent(userId)}`
    );

export const useTicket = (uuid: string | null) =>
    useApi<TicketDetail>(uuid ? `/api/support/${uuid}` : null, {
        revalidateOnFocus: false,
    });

export const supportClient = {
    create: (input: {
        type: TicketType;
        subject: string;
        message: string;
        contactEmail?: string;
    }) => api.post<{ uuid: string }>("/api/support", input),

    update: (input: {
        uuid: string;
        status?: TicketStatus;
        adminNote?: string;
        grant?: boolean;
    }) => api.patch("/api/support/queue", input),

    send: (uuid: string, content: string) =>
        api.post<SupportMessage>(`/api/support/${uuid}`, { content }),
};