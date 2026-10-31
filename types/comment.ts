// types/comment.ts
import type { Author } from "@/types/post";

export type PostComment = {
    uuid: string;
    content: string;
    mediaUrl: string | null;
    createdAt: string;
    author: Author;
    canDelete: boolean;
};