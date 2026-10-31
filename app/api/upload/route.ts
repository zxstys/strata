import { auth } from "@/lib/auth";
import { storeFile } from "@/lib/storage";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const RULES = {
    "post-image": { contentTypes: [...IMAGE_TYPES, "image/gif"], maxBytes: 4 * 1024 * 1024 },
    "comment-gif": { contentTypes: ["image/gif"], maxBytes: 4 * 1024 * 1024 },
    avatar: { contentTypes: IMAGE_TYPES, maxBytes: 2 * 1024 * 1024 },
    banner: { contentTypes: IMAGE_TYPES, maxBytes: 4 * 1024 * 1024 },
} as const;

type Kind = keyof typeof RULES;

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ message: "You must be signed in to upload." }, { status: 401 });
        }

        const form = await request.formData();
        const file = form.get("file");
        const kind = form.get("kind") as Kind | null;

        if (!(file instanceof File)) {
            return NextResponse.json({ message: "No file received." }, { status: 400 });
        }
        if (!kind || !(kind in RULES)) {
            return NextResponse.json({ message: "Unknown upload kind." }, { status: 400 });
        }

        const rule = RULES[kind];
        if (!(rule.contentTypes as readonly string[]).includes(file.type)) {
            return NextResponse.json({ message: `That file type isn't allowed for ${kind}.` }, { status: 400 });
        }
        if (file.size > rule.maxBytes) {
            return NextResponse.json({ message: "That file is too large." }, { status: 400 });
        }

        // Each kind gets its own folder in your Cloudinary media library.
        const url = await storeFile(`strata/${kind}`, file);

        return NextResponse.json({ url }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        console.error("[upload]", message);
        return NextResponse.json({ message }, { status: 500 });
    }
}