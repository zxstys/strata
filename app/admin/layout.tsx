// app/admin/layout.tsx
"use client";

import Nav from "@/components/Nav";
import { authClient } from "@/lib/auth/auth-client";
import { isAdmin, isStaff } from "@/lib/user/roles";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview", adminOnly: true },
  { href: "/admin/users", label: "Users", adminOnly: true },
  { href: "/admin/posts", label: "Posts", adminOnly: false },
  { href: "/admin/support", label: "Support", adminOnly: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();

  const role = session?.user.role;
  const admin = isAdmin(role);
  const denied = !isPending && !isStaff(role);
  const tabs = TABS.filter((t) => admin || !t.adminOnly);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl">
        <Nav session={session} />

        <div className="border-b border-border px-4 pt-4">
          <h1 className="text-xl font-semibold tracking-tight">
            {admin ? "Admin" : "Moderation"}
          </h1>

          {!denied && !isPending && (
            <nav className="mt-3 flex gap-6 overflow-x-auto">
              {tabs.map((tab) => {
                const active =
                  tab.href === "/admin"
                    ? pathname === tab.href
                    : pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`shrink-0 border-b-2 pb-2 text-sm transition-colors ${
                      active
                        ? "border-foreground font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <main className="px-4 py-6">
          {denied && (
            <p className="text-sm text-muted-foreground">
              You don't have access to this page.
            </p>
          )}
          <div hidden={denied || isPending}>{children}</div>
          {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
        </main>
      </div>
    </div>
  );
}