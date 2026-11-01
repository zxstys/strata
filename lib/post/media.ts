// lib/media.ts
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;

// Accepts only URLs served from your own Cloudinary account.
export function isBlobUrl(value: unknown): value is string {
    if (typeof value !== "string" || !CLOUD) return false;
    try {
        const url = new URL(value);
        return (
            url.protocol === "https:" &&
            url.hostname === "res.cloudinary.com" &&
            url.pathname.startsWith(`/${CLOUD}/`)
        );
    } catch {
        return false;
    }
}

export function isGifUrl(value: string) {
    return new URL(value).pathname.toLowerCase().endsWith(".gif");
}