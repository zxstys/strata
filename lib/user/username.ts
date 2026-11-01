// lib/username.ts
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(value: string) {
    return value.trim().toLowerCase();
}

export function validateUsername(value: string): string | null {
    if (!USERNAME_RE.test(value)) {
        return "Usernames are 3 to 20 characters: letters, numbers, and underscores.";
    }
    return null;
}