// lib/upload-client.ts
import { api } from "@/lib/api/api";

export type UploadKind = "post-image" | "comment-gif" | "avatar" | "banner";

export async function uploadMedia(file: File, kind: UploadKind): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);

    const { url } = await api.form<{ url: string }>("/api/upload", form);
    return url;
}