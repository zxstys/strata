// lib/text/entities.ts
// Safe to import from both client and server code. No server imports here.

// Group 1: the character before the sigil. It stops matches inside emails
// (name@site.com) and paths (/users/@name).
// Group 2: the sigil, "@" or "#".
// Group 3: the body. Starts with a letter, then letters, digits, or underscores.
const TOKEN_RE = /(^|[^\w@#/])([@#])([A-Za-z][A-Za-z0-9_]{1,49})(?!\w)/g;

const CODE_BLOCK_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`\n]*`/g;

export const MAX_TAGS = 10;
export const MAX_MENTIONS = 10;

export function stripCode(text: string) {
    return text.replace(CODE_BLOCK_RE, " ").replace(INLINE_CODE_RE, " ");
}

// Used on the server when saving. Returns lowercase, deduplicated values.
export function parseEntities(text: string) {
    const tags = new Set<string>();
    const usernames = new Set<string>();

    for (const m of stripCode(text).matchAll(TOKEN_RE)) {
        const sigil = m[2];
        const body = m[3].toLowerCase();

        if (sigil === "#") {
            if (tags.size < MAX_TAGS) tags.add(body);
        } else if (body.length >= 3 && body.length <= 20) {
            if (usernames.size < MAX_MENTIONS) usernames.add(body);
        }
    }

    return { tags: [...tags], usernames: [...usernames] };
}

export type Token =
    | { type: "text"; value: string }
    | { type: "tag"; value: string }
    | { type: "mention"; value: string };

// Used on the client when rendering. Splits text into plain text and entities.
export function tokenize(text: string): Token[] {
    const out: Token[] = [];
    let last = 0;

    for (const m of text.matchAll(TOKEN_RE)) {
        const sigilAt = (m.index ?? 0) + m[1].length;
        const body = m[3];
        const isTag = m[2] === "#";

        // Mentions must be 3 to 20 characters, the same rule as parseEntities.
        if (!isTag && (body.length < 3 || body.length > 20)) continue;

        if (sigilAt > last) out.push({ type: "text", value: text.slice(last, sigilAt) });
        out.push({ type: isTag ? "tag" : "mention", value: body.toLowerCase() });
        last = sigilAt + 1 + body.length;
    }

    if (last < text.length) out.push({ type: "text", value: text.slice(last) });
    return out;
}