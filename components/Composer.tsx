// components/Composer.tsx
"use client";

import { MarkdownHint } from "@/components/Markdown";
import MediaInput from "@/components/MediaInput";
import MentionTextarea from "@/components/MentionTextarea";
import DraftCounter from "@/components/composer/DraftCounter";
import DraftSubmit from "@/components/composer/DraftSubmit";
import { createDraftStore } from "@/lib/composer/draft-store";
import { postClient } from "@/lib/post/post-client";
import { usePostLimit } from "@/lib/post/post-limit-client";
import { checkPostText } from "@/lib/post/post-rules";
import { uploadMedia } from "@/lib/post/upload-client";
import { useMemo, useState } from "react";

export default function Composer({
    onPosted,
}: {
    onPosted: () => Promise<unknown>;
}) {
    const limit = usePostLimit();
    const store = useMemo(() => createDraftStore(), []);

    const [file, setFile] = useState<File | null>(null);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (posting) return;

        const text = store.get().trim();
        if (!text && !file) return;

        const problem = checkPostText(text, limit);
        if (problem) {
            setError(problem);
            return;
        }

        setError("");
        setPosting(true);
        try {
            const mediaUrl = file ? await uploadMedia(file, "post-image") : undefined;
            await postClient.create(text, mediaUrl);
            store.set("");
            setFile(null);
            await onPosted();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't create post.");
        } finally {
            setPosting(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="flex flex-col gap-2 rounded-lg border border-border p-4"
        >
            <MentionTextarea
                store={store}
                placeholder="What's happening?"
                maxLength={limit ?? undefined}
                rows={3}
                className="w-full p-4 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />

            <MarkdownHint />

            <MediaInput
                accept="image/png,image/jpeg,image/webp,image/gif"
                file={file}
                onChange={setFile}
                label="Add image"
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-between gap-3">
                <DraftCounter store={store} limit={limit} />
                <DraftSubmit
                    store={store}
                    hasAttachment={file !== null}
                    busy={posting}
                    idleLabel="Post"
                    busyLabel="Posting..."
                />
            </div>
        </form>
    );
}