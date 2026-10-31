// app/admin/layout.tsx
"use client";

import Nav from "@/components/Nav";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/posts", label: "Posts" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = authClient.useSession();
    const pathname = usePathname();

    if (isPending) {
        return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;
    }

    if (session?.user.role !== "admin") {
        return (
            <div className="min-h-screen">
                <div className="mx-auto max-w-5xl">
                    <Nav session={session} />
                    <p className="px-4 py-6 text-sm text-muted-foreground">
                        You don't have access to this page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-5xl">
                <Nav session={session} />

                <div className="border-b border-border px-4 pt-4">
                    <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
                    <nav className="mt-3 flex gap-6">
                        {TABS.map((tab) => {
                            const active =
                                tab.href === "/admin" ? pathname === tab.href : pathname.startsWith(tab.href);
                            return (
                                <Link
                                    key={tab.href}
                                    href={tab.href}
                                    className={`border-b-2 pb-2 text-sm transition-colors ${active
                                            ? "border-foreground font-medium text-foreground"
                                            : "border-transparent text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <main className="px-4 py-6">{children}</main>
            </div>
        </div>
    );
}