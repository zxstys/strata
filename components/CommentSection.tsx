// components/CommentSection.tsx
"use client";

import Avatar from "@/components/Avatar";
import MediaInput from "@/components/MediaInput";
import { UserName } from "@/components/UserName";
import { authClient } from "@/lib/auth/auth-client";
import { adjustCommentCount, commentClient, useComments } from "@/lib/comment/comment-client";
import { timeAgo } from "@/lib/time";
import { uploadMedia } from "@/lib/post/upload-client";
import type { PostComment } from "@/types/comment";
import Link from "next/link";
import { useState } from "react";
import { LuTrash2 } from "react-icons/lu";

const MAX_LENGTH = 500;
const MAX_GIF_BYTES = 5 * 1024 * 1024;

function CommentSkeleton() {
    return (
        <div className="flex animate-pulse gap-3 px-4 py-3">
            <div className="size-8 shrink-0 rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-secondary" />
                <div className="h-3 w-2/3 rounded bg-secondary" />
            </div>
        </div>
    );
}

export default function CommentSection({ postUuid }: { postUuid: string }) {
    const { data: session } = authClient.useSession();
    const { data: comments, isLoading, error, mutate } = useComments(postUuid);
    const [draft, setDraft] = useState("");
    const [gif, setGif] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [actionError, setActionError] = useState("");

    const canSubmit = (draft.trim().length > 0 || gif !== null) && !submitting;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        if (gif && gif.size > MAX_GIF_BYTES) {
            setActionError("That GIF is too large. The limit is 5 MB.");
            return;
        }

        setSubmitting(true);
        setActionError("");
        try {
            const mediaUrl = gif ? await uploadMedia(gif, "comment-gif") : undefined;
            await commentClient.create(postUuid, draft.trim(), mediaUrl);
            setDraft("");
            setGif(null);
            await Promise.all([mutate(), adjustCommentCount(postUuid, +1)]);
        } catch {
            setActionError("Couldn't post your reply. Try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async (comment: PostComment) => {
        setActionError("");
        try {
            await commentClient.remove(comment.uuid);
            await Promise.all([mutate(), adjustCommentCount(postUuid, -1)]);
        } catch {
            setActionError("Couldn't delete that reply. Try again.");
        }
    };

    return (
        <section className="-mx-4 mt-3 border-t border-border">
            {session ? (
                <form onSubmit={submit} className="flex gap-3 border-b border-border px-4 py-3">
                    <Avatar name={session.user.name} src={session.user.image} />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            maxLength={MAX_LENGTH}
                            rows={2}
                            placeholder="Post your reply"
                            className="w-full p-4 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                        />

                        <MediaInput
                            accept="image/gif"
                            file={gif}
                            onChange={setGif}
                            label="Add GIF"
                        />

                        <div className="flex items-center justify-end gap-3">
                            {draft.length > 0 && (
                                <span
                                    className={`text-xs ${draft.length > MAX_LENGTH - 50
                                        ? "text-destructive"
                                        : "text-muted-foreground"
                                        }`}
                                >
                                    {MAX_LENGTH - draft.length}
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                            >
                                {submitting ? "Replying..." : "Reply"}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="border-b border-border px-4 py-4 text-center text-sm text-muted-foreground">
                    <Link href="/auth/login" className="font-medium text-foreground hover:underline">
                        Sign in
                    </Link>{" "}
                    to reply to this post.
                </div>
            )}

            {actionError && (
                <p className="border-b border-border px-4 py-2 text-sm text-destructive">
                    {actionError}
                </p>
            )}

            {isLoading && (
                <div>
                    <CommentSkeleton />
                    <CommentSkeleton />
                </div>
            )}

            {error && (
                <p className="px-4 py-4 text-center text-sm text-muted-foreground">
                    Couldn't load replies.{" "}
                    <button onClick={() => mutate()} className="font-medium text-foreground hover:underline">
                        Try again
                    </button>
                </p>
            )}

            {comments?.length === 0 && (
                <div className="px-4 py-8 text-center">
                    <p className="text-sm font-medium">No replies yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Start the conversation with your reply.
                    </p>
                </div>
            )}

            {comments?.map((c) => (
                <article
                    key={c.uuid}
                    className="group flex gap-3 border-b border-border px-4 py-3 last:border-b-0"
                >
                    <Avatar name={c.author.name} src={c.author.image} />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-1.5 text-sm">
                            <UserName author={c.author} />
                            {c.author.username && (
                                <span className="text-muted-foreground">@{c.author.username}</span>
                            )}
                            <span className="text-muted-foreground">·</span>
                            <time
                                dateTime={c.createdAt}
                                title={new Date(c.createdAt).toLocaleString()}
                                className="text-muted-foreground"
                            >
                                {timeAgo(c.createdAt)}
                            </time>
                        </div>

                        {c.content && (
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed">
                                {c.content}
                            </p>
                        )}

                        {c.mediaUrl && (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={c.mediaUrl}
                                    alt="GIF reply"
                                    loading="lazy"
                                    className="mt-2 max-h-72 rounded-xl border border-border"
                                />
                            </>
                        )}
                    </div>

                    {c.canDelete && (
                        <button
                            aria-label="Delete reply"
                            onClick={() => remove(c)}
                            className="self-start rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                        >
                            <LuTrash2 className="size-4" />
                        </button>
                    )}
                </article>
            ))}
        </section>
    );
}