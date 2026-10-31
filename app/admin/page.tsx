// app/admin/page.tsx
"use client";

import { fetcher } from "@/lib/fetcher";
import type { AdminStats } from "@/types/admin";
import Link from "next/link";
import useSWR from "swr";

const CARDS: { key: keyof AdminStats; label: string }[] = [
  { key: "users", label: "Users" },
  { key: "admins", label: "Admins" },
  { key: "verified", label: "Verified" },
  { key: "goldPermitted", label: "Gold permitted" },
  { key: "posts", label: "Posts" },
  { key: "postsToday", label: "Posts in last 24h" },
  { key: "comments", label: "Replies" },
  { key: "likes", label: "Likes" },
];

export default function AdminOverview() {
  const { data, error, isLoading } = useSWR<AdminStats>("/api/admin/stats", fetcher);

  return (
    <div className="flex flex-col gap-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error.message}</p>}

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CARDS.map((card) => (
            <div key={card.key} className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{data[card.key]}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/admin/users"
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-hover"
        >
          Manage users
        </Link>
        <Link
          href="/admin/posts"
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-hover"
        >
          Review posts
        </Link>
      </div>
    </div>
  );
}