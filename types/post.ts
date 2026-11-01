// types/post.ts
export type Author = {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
    verified: boolean;
    gold: boolean;
    mod: boolean;
};

export type Post = {
    uuid: string;
    author: Author;
    content: string;
    mediaUrl: string | null;
    likes: number;
    likedByMe: boolean;
    comments: number;
    createdAt: string;
    pinned: boolean;
    edited: boolean;
    mine: boolean;
};