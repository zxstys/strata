// lib/support.ts
export const TICKET_TYPES = [
    "account_recovery",
    "verification",
    "gold",
    "mod",
    "other",
] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

export const TICKET_STATUSES = ["open", "in_progress", "resolved", "rejected"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const OPEN_STATUSES: TicketStatus[] = ["open", "in_progress"];

type TypeInfo = {
    label: string;
    description: string;
    signedInOnly: boolean;
    grantLabel?: string;
};

export const TYPE_INFO: Record<TicketType, TypeInfo> = {
    account_recovery: {
        label: "Account recovery",
        description: "Can't sign in? Tell us which account is yours and we'll help.",
        signedInOnly: false,
    },
    verification: {
        label: "Blue verification",
        description: "Request a blue checkmark for your account.",
        signedInOnly: true,
        grantLabel: "Grant blue checkmark",
    },
    gold: {
        label: "Gold access",
        description: "Request permission to show a gold checkmark.",
        signedInOnly: true,
        grantLabel: "Grant gold access",
    },
    mod: {
        label: "Moderator application",
        description: "Apply to help review reports and posts.",
        signedInOnly: true,
        grantLabel: "Make moderator",
    },
    other: {
        label: "Something else",
        description: "Questions, bugs, or feedback.",
        signedInOnly: false,
    },
};

export const isTicketType = (v: unknown): v is TicketType =>
    typeof v === "string" && (TICKET_TYPES as readonly string[]).includes(v);

export const isTicketStatus = (v: unknown): v is TicketStatus =>
    typeof v === "string" && (TICKET_STATUSES as readonly string[]).includes(v);