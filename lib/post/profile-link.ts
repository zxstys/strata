// lib/profile-link.ts
export function profilePath(author: { id: string; username: string | null }) {
    return `/users/${author.username ?? author.id}`;
}