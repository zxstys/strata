// components/PostCard.tsx
"use client";

import Avatar from "@/components/Avatar";
import CommentSection from "@/components/CommentSection";
import { UserName } from "@/components/UserName";
import { postClient, refreshPostLists } from "@/lib/post-client";
import { usePostLimit } from "@/lib/post-limit-client";
import { checkPostText } from "@/lib/post-rules";
import { timeAgo } from "@/lib/time";
import type { Post } from "@/types/post";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    LuEllipsis,
    LuMessageCircle,
    LuPencil,
    LuPin,
    LuPinOff,
    LuShare2,
    LuThumbsUp,
    LuTrash2,
} from "react-icons/lu";
import Markdown, { MarkdownHint } from "@/components/Markdown";
import { useRouter } from "next/navigation";

type PostCardProps = {
    post: Post;
    onLike: (post: Post) => void;
    expanded?: boolean;
    onDeleted?: () => void;
};

const menuItem =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-hover disabled:opacity-50";

export default function PostCard({
    post,
    onLike,
    expanded = false,
    onDeleted,
}: PostCardProps) {
    const limit = usePostLimit();
    const [showComments, setShowComments] = useState(expanded);
    const [copied, setCopied] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(post.content);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const postHref = `/posts/${post.uuid}`;

    // Close the menu when clicking anywhere else.
    useEffect(() => {
        if (!menuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [menuOpen]);

    const share = async () => {
        const url = `${window.location.origin}${postHref}`;

        if (navigator.share) {
            try {
                await navigator.share({ url, text: post.content.slice(0, 100) });
                return;
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard can be blocked outside secure contexts.
        }
    };

    const run = async (task: () => Promise<unknown>, fallback: string) => {
        setBusy(true);
        setError("");
        try {
            await task();
            await refreshPostLists();
        } catch (err) {
            setError(err instanceof Error ? err.message : fallback);
        } finally {
            setBusy(false);
        }
    };

    const togglePin = () => {
        setMenuOpen(false);
        run(() => postClient.pin(post.uuid, !post.pinned), "Couldn't update pin.");
    };

    const startEdit = () => {
        setMenuOpen(false);
        setDraft(post.content);
        setError("");
        setEditing(true);
    };

    const saveEdit = () => {
        const text = draft.trim();

        if (!text && !post.mediaUrl) {
            setError("Write something before saving.");
            return;
        }

        const problem = checkPostText(text, limit);
        if (problem) {
            setError(problem);
            return;
        }

        run(async () => {
            await postClient.edit(post.uuid, text);
            setEditing(false);
        }, "Couldn't save changes.");
    };

    const remove = () => {
        setMenuOpen(false);
        if (!confirm("Delete this post? Its likes and replies will be removed too.")) return;

        run(async () => {
            await postClient.remove(post.uuid);
            onDeleted?.();
        }, "Couldn't delete post.");
    };

    return (
        <article className="rounded-lg border border-border p-4">
            {post.pinned && (
                <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <LuPin className="size-3" />
                    Pinned
                </p>
            )}

            <header className="mb-2 flex items-center gap-2 text-sm">
                <Link
                    href={profilePathFor(post)}
                    aria-label={`${post.author.name}'s profile`}
                    className="rounded-full transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <Avatar name={post.author.name} src={post.author.image} />
                </Link>
                <UserName author={post.author} />
                <span className="text-muted-foreground">·</span>
                <Link
                    href={postHref}
                    title={new Date(post.createdAt).toLocaleString()}
                    className="text-muted-foreground hover:underline"
                >
                    {timeAgo(post.createdAt)}
                </Link>
                {post.edited && <span className="text-xs text-muted-foreground">· edited</span>}

                {post.mine && (
                    <div ref={menuRef} className="relative ml-auto">
                        <button
                            aria-label="Post options"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((open) => !open)}
                            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                        >
                            <LuEllipsis />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg">
                                <button onClick={startEdit} className={menuItem}>
                                    <LuPencil className="size-4" />
                                    Edit
                                </button>
                                <button onClick={togglePin} disabled={busy} className={menuItem}>
                                    {post.pinned ? <LuPinOff className="size-4" /> : <LuPin className="size-4" />}
                                    {post.pinned ? "Unpin from profile" : "Pin to profile"}
                                </button>
                                <button
                                    onClick={remove}
                                    disabled={busy}
                                    className={`${menuItem} text-destructive`}
                                >
                                    <LuTrash2 className="size-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {editing ? (
                <div className="flex flex-col gap-2">
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={limit ?? undefined}
                        rows={4}
                        className="w-full resize-none rounded-md border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <MarkdownHint />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            {limit !== null ? `${draft.length}/${limit}` : `${draft.length} characters`}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditing(false)}
                                disabled={busy}
                                className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:bg-hover"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={busy}
                                className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground disabled:opacity-50"
                            >
                                {busy ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                post.content && (
                    <div
                        onClick={(e) => {
                            // Let links, buttons, and inputs handle their own clicks.
                            if ((e.target as HTMLElement).closest("a, button, input, textarea")) return;
                            router.push(postHref);
                        }}
                        className="cursor-pointer"
                    >
                        <Markdown>{post.content}</Markdown>
                    </div>
                )
            )}

            {post.mediaUrl && (
                <Link
                    href={postHref}
                    className="mt-3 block overflow-hidden rounded-xl border border-border"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={post.mediaUrl}
                        alt="Post attachment"
                        loading="lazy"
                        className="max-h-[480px] w-full object-cover"
                    />
                </Link>
            )}

            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

            <footer className="mt-3 flex items-center gap-1">
                <button
                    aria-label="Like"
                    aria-pressed={post.likedByMe}
                    onClick={() => onLike(post)}
                    className={`flex items-center justify-center gap-2 rounded-md p-2 transition-colors hover:bg-hover ${post.likedByMe
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <span className="select-none text-sm">{post.likes}</span>
                    <LuThumbsUp className={post.likedByMe ? "fill-current" : ""} />
                </button>

                <button
                    aria-label="Comments"
                    aria-expanded={showComments}
                    onClick={() => setShowComments((s) => !s)}
                    className={`flex items-center justify-center gap-2 rounded-md p-2 transition-colors hover:bg-hover ${showComments
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <span className="select-none text-sm">{post.comments}</span>
                    <LuMessageCircle />
                </button>

                <button
                    aria-label="Share"
                    onClick={share}
                    className="ml-auto flex items-center gap-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                >
                    {copied && <span className="text-xs">Link copied</span>}
                    <LuShare2 />
                </button>
            </footer>

            {showComments && <CommentSection postUuid={post.uuid} />}
        </article>
    );
}

function profilePathFor(post: Post) {
    return `/users/${post.author.username ?? post.author.id}`;
}