// types/admin.ts
export type AdminStats = {
    users: number;
    admins: number;
    verified: number;
    goldPermitted: number;
    posts: number;
    postsToday: number;
    comments: number;
    likes: number;
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