// types/search.ts
import type { Post } from "@/types/post";

export type SearchUser = {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    verified: boolean;
    gold: boolean;
};

export type SearchResult = {
    users: SearchUser[];
    posts: Post[];
};

export type PersonCard = SearchUser & {
    isFollowing: boolean;
};