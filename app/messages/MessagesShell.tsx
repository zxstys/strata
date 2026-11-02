// app/messages/MessagesShell.tsx
"use client";

import InboxList from "@/app/messages/InboxList";
import Nav from "@/components/Nav";
import { authClient } from "@/lib/auth/auth-client";
import { usePathname } from "next/navigation";

export default function MessagesShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = authClient.useSession();
    const pathname = usePathname();
    const onThread = pathname !== "/messages";

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-5xl">
                <Nav session={session} wide />

                <div className="flex h-[calc(100dvh-3.5rem)]">
                    <aside
                        className={`${onThread ? "hidden lg:flex" : "flex"} w-full flex-col border-r border-border lg:w-80`}
                    >
                        <InboxList />
                    </aside>

                    <section
                        className={`${onThread ? "flex" : "hidden lg:flex"} min-w-0 flex-1 flex-col`}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}