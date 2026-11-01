// lib/site.ts
export const SITE_NAME = "Strata";
export const SITE_DESCRIPTION =
  "Strata is a clean, modern social platform for short posts, media, and conversation.";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://strata.luncs.my.id"
).replace(/\/$/, "");

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;