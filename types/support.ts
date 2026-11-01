// types/support.ts
import type { TicketStatus, TicketType } from "@/lib/support/support";

export type MyTicket = {
    uuid: string;
    type: TicketType;
    subject: string;
    status: TicketStatus;
    adminNote: string | null;
    createdAt: string;
};

export type QueueTicket = MyTicket & {
    message: string;
    contactEmail: string | null;
    user: {
        id: string;
        name: string;
        username: string | null;
        email: string;
        image: string | null;
        verified: boolean;
        goldPermission: boolean;
        goldEnabled: boolean;
        role: string | null;
    } | null;
};