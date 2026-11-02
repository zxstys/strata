// types/dm.ts
export type DmUser = {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    verified: boolean;
    gold: boolean;
    mod: boolean;
};

export type DmMessage = {
    uuid: string;
    conversationId: string;
    senderId: string;
    content: string;
    mediaUrl: string | null;
    createdAt: string;
};

// Messages the client knows about before the server confirms them.
export type LocalMessage = DmMessage & { status?: "sending" | "failed" };

export type DmInboxItem = {
    id: string;
    other: DmUser;
    lastMessageAt: string;
    unread: number;
    lastMessage: {
        content: string;
        mediaUrl: string | null;
        senderId: string;
        createdAt: string;
    } | null;
};

export type DmThread = {
    id: string;
    other: DmUser;
    otherLastReadAt: string | null;
    messages: LocalMessage[];
    hasMore: boolean;
};