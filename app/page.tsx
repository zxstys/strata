// app/page.tsx
"use client";

import Composer from "@/components/Composer";
import Nav from "@/components/Nav";
import PeopleStrip from "@/components/PeopleStrip";
import PostCard from "@/components/PostCard";
import TrendingTags from "@/components/TrendingTags";
import { authClient } from "@/lib/auth/auth-client";
import { postClient, usePosts } from "@/lib/post/post-client";
import type { Post } from "@/types/post";
import { useCallback } from "react";

export default function Home() {
  const { data: session } = authClient.useSession();
  const { data, error, isLoading, mutate } = usePosts();
  const posts = data ?? [];

  const likePost = useCallback(
    async (post: Post) => {
      try {
        await postClient.like(post.uuid);
        await mutate();
      } catch (err) {
        console.error(err);
      }
    },
    [mutate]
  );

  return (
    <div className="min-h-screen">
      <Nav session={session} />

      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6 xl:grid xl:max-w-none xl:grid-cols-[1fr_minmax(0,36rem)_1fr] xl:gap-0 xl:px-0">
        <aside className="flex w-full flex-col gap-6 xl:sticky xl:top-20 xl:col-start-3 xl:row-start-1 xl:w-72 xl:self-start xl:justify-self-start xl:pl-8">
          <TrendingTags />
          <PeopleStrip />
        </aside>

        <div className="flex min-w-0 flex-col px-4 gap-6 xl:col-start-2 xl:row-start-1">
          <h1 className="sr-only">Strata: latest posts and people</h1>

          <Composer onPosted={() => mutate()} />

          {error && <p className="text-sm text-red-500">Failed to load posts.</p>}
          {isLoading && <p className="text-sm text-muted-foreground">Loading posts...</p>}

          {posts.map((post) => (
            <PostCard key={post.uuid} post={post} onLike={likePost} />
          ))}
        </div>
      </div>
    </div>
  );
}