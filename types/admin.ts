// types/admin.ts
export type Day = { day: string; value: number };

export type AdminStats = {
    totals: {
        users: number;
        admins: number;
        verified: number;
        goldPermitted: number;
        posts: number;
        postsToday: number;
        replies: number;
        likes: number;
    };
    series: {
        users: Day[];
        posts: Day[];
        replies: Day[];
        likes: Day[];
    };
    mix: {
        admins: number;
        verified: number;
        goldOnly: number;
        regular: number;
    };
};

export type AdminUser = {
    id: string;
    name: string;
    username: string | null;
    email: string;
    image: string | null;
    role: string | null;
    verified: boolean;
    goldPermission: boolean;
    goldEnabled: boolean;
    postCount: number;
    createdAt: string;
};