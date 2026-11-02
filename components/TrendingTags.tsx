// components/TrendingTags.tsx
"use client";

import { useTrending } from "@/lib/tags/tag-client";
import Link from "next/link";

export default function TrendingTags() {
  const { data, isLoading } = useTrending();

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading trends...</p>;
  if (!data || data.length === 0) return null;

  return (
    <section className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <h2 className="mb-1 text-sm font-medium">Trending</h2>
      <ul className="flex flex-col">
        {data.map((t) => (
          <li key={t.tag}>
            <Link
              href={`/tags/${t.tag}`}
              className="flex flex-col rounded-md px-2 py-1.5 transition-colors hover:bg-hover"
            >
              <span className="text-sm font-medium">#{t.tag}</span>
              <span className="text-xs text-muted-foreground">
                {t.posts} {t.posts === 1 ? "post" : "posts"} this week
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}