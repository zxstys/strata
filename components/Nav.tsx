// components/Nav.tsx
"use client";

import Avatar from "@/components/Avatar";
import type { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { profilePath } from "@/lib/profile-link";
import { useSearch } from "@/lib/search-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    LuLogOut,
    LuSearch,
    LuSettings,
    LuShieldCheck,
    LuUser,
} from "react-icons/lu";

type SessionData = typeof auth.$Infer.Session;

function useDebounced<T>(value: T, delay = 250) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

const sectionLabel =
    "px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground";

export default function Nav({
    session,
    wide = false,
}: {
    session: SessionData | null;
    wide?: boolean;
}) {
    const router = useRouter();
    const user = session?.user;

    const [q, setQ] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const searchRef = useRef<HTMLFormElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const term = useDebounced(q.trim());
    const { data, isLoading } = useSearch(term);
    const showResults = searchOpen && term.length > 0;

    // Close dropdowns when clicking outside them.
    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (searchRef.current && !searchRef.current.contains(target)) {
                setSearchOpen(false);
            }
            if (menuRef.current && !menuRef.current.contains(target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = q.trim();
        if (!value) return;
        setSearchOpen(false);
        router.push(`/search?q=${encodeURIComponent(value)}`);
    };

    const signOut = async () => {
        setMenuOpen(false);
        await authClient.signOut();
        window.location.assign("/");
    };

    return (
        <header className="sticky top-0 z-40 border-border bg-background/95 backdrop-blur">
            <div
                className={`mx-auto flex h-14 max-w-xl items-center gap-3 px-4 ${wide ? "lg:max-w-5xl" : ""
                    }`}
            >
                <Link
                    href="/"
                    className="shrink-0 font-mono text-base font-semibold tracking-tight"
                >
                    Strata
                </Link>

                <form ref={searchRef} onSubmit={submit} className="relative min-w-0 flex-1">
                    <LuSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setSearchOpen(true);
                        }}
                        onFocus={() => setSearchOpen(true)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setSearchOpen(false);
                        }}
                        placeholder="Search people and posts"
                        aria-label="Search"
                        className="h-9 w-full rounded-full border border-border bg-secondary pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />

                    {showResults && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-border bg-background py-1 shadow-lg">
                            {isLoading && !data && (
                                <p className="px-3 py-2 text-sm text-muted-foreground">Searching...</p>
                            )}

                            {data && data.users.length === 0 && data.posts.length === 0 && (
                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                    No results for “{term}”
                                </p>
                            )}

                            {data && data.users.length > 0 && (
                                <>
                                    <p className={sectionLabel}>People</p>
                                    {data.users.slice(0, 5).map((u) => (
                                        <Link
                                            key={u.id}
                                            href={profilePath(u)}
                                            onClick={() => setSearchOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 hover:bg-hover"
                                        >
                                            <Avatar name={u.name} src={u.image} />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{u.name}</p>
                                                {u.username && (
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        @{u.username}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </>
                            )}

                            {data && data.posts.length > 0 && (
                                <>
                                    <p className={sectionLabel}>Posts</p>
                                    {data.posts.slice(0, 5).map((p) => (
                                        <Link
                                            key={p.uuid}
                                            href={`/posts/${p.uuid}`}
                                            onClick={() => setSearchOpen(false)}
                                            className="block px-3 py-2 hover:bg-hover"
                                        >
                                            <p className="truncate text-xs text-muted-foreground">
                                                {p.author.name}
                                            </p>
                                            <p className="line-clamp-2 text-sm">{p.content}</p>
                                        </Link>
                                    ))}
                                </>
                            )}

                            {term && (
                                <Link
                                    href={`/search?q=${encodeURIComponent(term)}`}
                                    onClick={() => setSearchOpen(false)}
                                    className="mt-1 block border-t border-border px-3 py-2 text-sm font-medium hover:bg-hover"
                                >
                                    See all results
                                </Link>
                            )}
                        </div>
                    )}
                </form>

                {user ? (
                    <div ref={menuRef} className="relative shrink-0">
                        <button
                            aria-label="Account menu"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((open) => !open)}
                            className="rounded-full ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Avatar name={user.name} src={user.image} />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg">
                                <div className="px-3 py-2">
                                    <p className="truncate text-sm font-medium">{user.name}</p>
                                    {user.username && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            @{user.username}
                                        </p>
                                    )}
                                </div>

                                <div className="my-1 border-t border-border" />

                                <MenuLink
                                    href={profilePath(user)}
                                    icon={<LuUser className="size-4" />}
                                    label="Profile"
                                    onNavigate={() => setMenuOpen(false)}
                                />
                                <MenuLink
                                    href="/settings/profile"
                                    icon={<LuSettings className="size-4" />}
                                    label="Settings"
                                    onNavigate={() => setMenuOpen(false)}
                                />
                                {user.role === "admin" && (
                                    <MenuLink
                                        href="/admin"
                                        icon={<LuShieldCheck className="size-4" />}
                                        label="Admin"
                                        onNavigate={() => setMenuOpen(false)}
                                    />
                                )}

                                <div className="my-1 border-t border-border" />

                                <button
                                    onClick={signOut}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-hover"
                                >
                                    <LuLogOut className="size-4" />
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link
                        href="/auth/login"
                        className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        Sign in
                    </Link>
                )}
            </div>
        </header>
    );
}

function MenuLink({
    href,
    icon,
    label,
    onNavigate,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    onNavigate: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-hover"
        >
            {icon}
            {label}
        </Link>
    );
}