// app/page.tsx
"use client";

import { MarkdownHint } from "@/components/Markdown";
import MediaInput from "@/components/MediaInput";
import Nav from "@/components/Nav";
import PeopleStrip from "@/components/PeopleStrip";
import PostCard from "@/components/PostCard";
import { authClient } from "@/lib/auth/auth-client";
import { postClient, usePosts } from "@/lib/post/post-client";
import { usePostLimit } from "@/lib/post/post-limit-client";
import { checkPostText } from "@/lib/post/post-rules";
import { uploadMedia } from "@/lib/post/upload-client";
import type { Post } from "@/types/post";
import { useState } from "react";

export default function Home() {
  const { data: session } = authClient.useSession();
  const limit = usePostLimit();
  const { data, error, isLoading, mutate } = usePosts();
  const posts = data ?? [];

  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text && !file) return;

    const problem = checkPostText(text, limit);
    if (problem) {
      setPostError(problem);
      return;
    }

    setPostError("");
    setPosting(true);
    try {
      const mediaUrl = file ? await uploadMedia(file, "post-image") : undefined;
      await postClient.create(text, mediaUrl);
      setContent("");
      setFile(null);
      await mutate();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Couldn't create post.");
    } finally {
      setPosting(false);
    }
  };

  const likePost = async (post: Post) => {
    try {
      await postClient.like(post.uuid);
      await mutate();
    } catch (err) {
      console.error(err);
    }
  };

  const canPost = !posting && (content.trim().length > 0 || file !== null);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-xl lg:max-w-5xl">
        <Nav session={session} wide />

        <div className="flex flex-col gap-6 px-4 py-6 lg:grid lg:grid-cols-[minmax(0,36rem)_16rem] lg:justify-center lg:gap-8 lg:px-0">
          <aside className="order-first lg:order-last lg:sticky lg:top-20 lg:self-start">
            <PeopleStrip />
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            <h1 className="sr-only">Strata: latest posts and people</h1>

            <form
              onSubmit={createPost}
              className="flex flex-col gap-2 rounded-lg border border-border p-4"
            >
              <textarea
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={limit ?? undefined}
                rows={3}
                className="w-full p-4 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />

              {limit !== null && content.length > limit * 0.8 && (
                <p
                  className={`text-right text-xs ${
                    content.length >= limit
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {limit - content.length}
                </p>
              )}

              <MarkdownHint />

              <MediaInput
                accept="image/png,image/jpeg,image/webp,image/gif"
                file={file}
                onChange={setFile}
                label="Add image"
              />

              {postError && (
                <p className="text-sm text-destructive">{postError}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!canPost}
                  className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>

            {error && <p className="text-sm text-red-500">Failed to load posts.</p>}
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading posts...</p>
            )}

            {posts.map((post) => (
              <PostCard key={post.uuid} post={post} onLike={likePost} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}