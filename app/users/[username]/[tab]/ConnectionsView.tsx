// app/users/[username]/[tab]/ConnectionsView.tsx
"use client";

import Avatar from "@/components/Avatar";
import Nav from "@/components/Nav";
import { UserName } from "@/components/UserName";
import { useApi } from "@/lib/api/use-api";
import { authClient } from "@/lib/auth/auth-client";
import { profilePath } from "@/lib/post/profile-link";
import {
  CONNECTION_TABS,
  type ConnectionTab,
  type ConnectionUser,
} from "@/types/connections";
import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";

const TAB_LABEL: Record<ConnectionTab, string> = {
  followers: "Followers",
  following: "Following",
};

const EMPTY_TEXT: Record<ConnectionTab, string> = {
  followers: "No followers yet.",
  following: "Not following anyone yet.",
};

export default function ConnectionsView({
  username,
  tab,
}: {
  username: string;
  tab: ConnectionTab;
}) {
  const { data: session } = authClient.useSession();

  const key = `/api/follows?user=${encodeURIComponent(username)}&type=${tab}`;
  const { data, error, isLoading } = useApi<ConnectionUser[]>(key);

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-xl">
        <Nav session={session} />

        <header className="sticky top-14 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center gap-3 px-4 pt-3">
            <Link
              href={`/users/${username}`}
              aria-label={`Back to @${username}`}
              className="-ml-2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
              <LuArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">@{username}</p>
            </div>
          </div>

          <nav role="tablist" className="mt-2 grid grid-cols-2">
            {CONNECTION_TABS.map((t) => {
              const active = t === tab;
              return (
                <Link
                  key={t}
                  href={`/users/${username}/${t}`}
                  role="tab"
                  aria-selected={active}
                  className={`relative py-3 text-center text-sm transition-colors hover:bg-hover ${active
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {TAB_LABEL[t]}
                  {active && (
                    <span className="absolute inset-x-1/3 bottom-0 h-1 rounded-full bg-sky-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="px-4 py-4">
          {isLoading && !data && (
            <ul className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex animate-pulse items-center gap-3 py-3">
                  <div className="size-10 shrink-0 rounded-full bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-secondary" />
                    <div className="h-3 w-1/4 rounded bg-secondary" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error.message || "Couldn't load this list."}
            </div>
          )}

          {data?.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm font-medium">{EMPTY_TEXT[tab]}</p>
            </div>
          )}

          {data && data.length > 0 && (
            <ul className="divide-y divide-border">
              {data.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-3">
                  <Link
                    href={profilePath(u)}
                    aria-label={`${u.name}'s profile`}
                    className="shrink-0 rounded-full transition-opacity hover:opacity-80"
                  >
                    <Avatar name={u.name} src={u.image} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <UserName author={u} className="block truncate text-sm" />
                    {u.username && (
                      <p className="truncate text-xs text-muted-foreground">
                        @{u.username}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}