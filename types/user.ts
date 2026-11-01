// types/user.ts
import type { Post } from "@/types/post";

export type UserProfile = {
    mod: boolean | undefined;
    id: string;
    name: string;
    username: string | null;
    about: string;
    image: string | null;
    banner: string | null;
    verified: boolean;
    gold: boolean;
    createdAt: string;
    isOwner: boolean;
    followers: number;
    following: number;
    isFollowing: boolean;
};

export type UserPage = {
    user: UserProfile;
    posts: Post[];
};

export type MyProfile = {
    name: string;
    username: string | null;
    about: string;
    image: string | null;
    banner: string | null;
    verified: boolean;
    goldPermission: boolean;
    goldEnabled: boolean;
};