// components/comments/ReplyForm.tsx
"use client";

import Avatar from "@/components/Avatar";
import MediaInput from "@/components/MediaInput";
import MentionTextarea from "@/components/MentionTextarea";
import DraftCounter from "@/components/composer/DraftCounter";
import DraftSubmit from "@/components/composer/DraftSubmit";
import { authClient } from "@/lib/auth/auth-client";
import { commentClient } from "@/lib/comment/comment-client";
import { createDraftStore } from "@/lib/composer/draft-store";
import { uploadMedia } from "@/lib/post/upload-client";
import { useMemo, useState } from "react";

const MAX_LENGTH = 500;
const MAX_GIF_BYTES = 5 * 1024 * 1024;

export default function ReplyForm({
    postUuid,
    onPosted,
}: {
    postUuid: string;
    onPosted: () => Promise<unknown>;
}) {
    const { data: session } = authClient.useSession();
    const store = useMemo(() => createDraftStore(), []);

    const [gif, setGif] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const text = store.get().trim();
        if (!text && !gif) return;

        if (gif && gif.size > MAX_GIF_BYTES) {
            setError("That GIF is too large. The limit is 5 MB.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const mediaUrl = gif ? await uploadMedia(gif, "comment-gif") : undefined;
            await commentClient.create(postUuid, text, mediaUrl);
            store.set("");
            setGif(null);
            await onPosted();
        } catch {
            setError("Couldn't post your reply. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // CommentSection shows the sign-in prompt when there's no session.
    if (!session) return null;

    return (
        <form onSubmit={submit} className="flex gap-3 border-b border-border px-4 py-3">
            <Avatar name={session.user.name} src={session.user.image} />

            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <MentionTextarea
                    store={store}
                    rows={2}
                    maxLength={MAX_LENGTH}
                    placeholder="Post your reply"
                    className="w-full p-2 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                />

                <MediaInput accept="image/gif" file={gif} onChange={setGif} label="Add GIF" />

                {error && <p className="text-xs text-destructive">{error}</p>}

                <div className="flex items-center justify-end gap-3">
                    <DraftCounter store={store} limit={MAX_LENGTH} threshold={0.9} />
                    <DraftSubmit
                        store={store}
                        hasAttachment={gif !== null}
                        busy={submitting}
                        idleLabel="Reply"
                        busyLabel="Replying..."
                    />
                </div>
            </div>
        </form>
    );
}