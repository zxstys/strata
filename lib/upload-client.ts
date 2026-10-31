// lib/upload-client.ts
export type UploadKind = "post-image" | "comment-gif" | "avatar" | "banner";

export async function uploadMedia(file: File, kind: UploadKind) {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    // Don't set Content-Type yourself. The browser adds the multipart boundary.
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.message ?? "Upload failed.");
    return data.url as string;
}