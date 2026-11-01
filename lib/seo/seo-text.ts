// lib/seo-text.ts

// Turns markdown into a short plain-text description for meta tags.
export function plainExcerpt(markdown: string, max = 160) {
    const text = markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/`([^`]*)`/g, "$1")
        .replace(/[*_~>#-]+/g, "")
        .replace(/\s+/g, " ")
        .trim();

    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}