// types/connections.ts
export type ConnectionUser = {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    verified: boolean;
    gold: boolean;
    mod: boolean;
};

export const CONNECTION_TABS = ["followers", "following"] as const;
export type ConnectionTab = (typeof CONNECTION_TABS)[number];