// lib/support-client.ts
import { api } from "@/lib/api/api";
import type { TicketStatus, TicketType } from "@/lib/support/support";
import type { MyTicket, QueueTicket } from "@/types/support";
import useSWR from "swr";

export const useMyTickets = (enabled: boolean) =>
    useSWR<MyTicket[]>(enabled ? "/api/support" : null);

export const useQueue = (filter: string) =>
    useSWR<QueueTicket[]>(`/api/support/queue?status=${filter}`);

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
};