// lib/post-rules.ts
export const FREE_POST_LIMIT = 2000;

// Returns an error message, or null if the text is allowed.
// Pass null as the limit for unlimited accounts.
export function checkPostText(text: string, limit: number | null): string | null {
    if (limit !== null && text.length > limit) {
        return `Posts are limited to ${limit.toLocaleString()} characters. Verified accounts have no limit.`;
    }
    return null;
}