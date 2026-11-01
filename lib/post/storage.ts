// lib/storage.ts
import { createHash } from "node:crypto";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME!;
const API_KEY = process.env.CLOUDINARY_API_KEY!;
const API_SECRET = process.env.CLOUDINARY_API_SECRET!;

export async function storeFile(folder: string, file: File) {
    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary requires the params to sign in alphabetical order, then the secret.
    const signature = createHash("sha1")
        .update(`folder=${folder}&timestamp=${timestamp}${API_SECRET}`)
        .digest("hex");

    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    form.append("timestamp", String(timestamp));
    form.append("api_key", API_KEY);
    form.append("signature", signature);

    // resource_type "image" also accepts GIFs.
    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
        { method: "POST", body: form }
    );
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error?.message ?? "Upload failed.");
    }
    return data.secure_url as string;
}