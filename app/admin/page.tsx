// app/admin/page.tsx
"use client";

import Donut, { type Slice } from "@/components/charts/Donut";
import TrendChart, { type Line } from "@/components/charts/TrendChart";
import type { AdminStats } from "@/types/admin";
import Link from "next/link";
import type { ReactNode } from "react";
import useSWR from "swr";

const COLOR = {
  users: "#0ea5e9",
  posts: "#10b981",
  replies: "#f59e0b",
  likes: "#f43f5e",
} as const;

function Card({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-lg border border-border p-4 ${className}`}>
      <h2 className="mb-3 text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminOverview() {
  const { data, error, isLoading } = useSWR<AdminStats>("/api/admin/stats");

  if (error) return <p className="text-sm text-red-500">{error.message}</p>;
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const { totals: t, series: s, mix: m } = data;

  const cards: [string, number][] = [
    ["Users", t.users],
    ["Admins", t.admins],
    ["Verified", t.verified],
    ["Gold permitted", t.goldPermitted],
    ["Posts", t.posts],
    ["Posts (24h)", t.postsToday],
    ["Replies", t.replies],
    ["Likes", t.likes],
  ];

  const growth: Line[] = [
    { label: "New users", color: COLOR.users, data: s.users },
    { label: "Posts", color: COLOR.posts, data: s.posts },
  ];

  const engagement: Line[] = [
    { label: "Replies", color: COLOR.replies, data: s.replies },
    { label: "Likes", color: COLOR.likes, data: s.likes },
  ];

  const mix: Slice[] = [
    { label: "Admins", value: m.admins, color: "#8b5cf6" },
    { label: "Verified", value: m.verified, color: "#0ea5e9" },
    { label: "Gold", value: m.goldOnly, color: "#f59e0b" },
    { label: "Regular", value: m.regular, color: "#737373" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Growth · last 14 days" className="lg:col-span-2">
          <TrendChart lines={growth} />
        </Card>
        <Card title="Account mix">
          <Donut slices={mix} />
        </Card>
      </div>

      <Card title="Engagement · last 14 days">
        <TrendChart lines={engagement} />
      </Card>

      <div className="flex gap-3">
        <Link href="/admin/users" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-hover">
          Manage users
        </Link>
        <Link href="/admin/posts" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-hover">
          Review posts
        </Link>
      </div>
    </div>
  );
}