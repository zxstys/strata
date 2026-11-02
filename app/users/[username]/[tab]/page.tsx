// app/users/[username]/[tab]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ConnectionsView from "./ConnectionsView";
import { CONNECTION_TABS, type ConnectionTab } from "@/types/connections";

type Props = { params: Promise<{ username: string; tab: string }> };

function isConnectionTab(value: string): value is ConnectionTab {
    return (CONNECTION_TABS as readonly string[]).includes(value);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username, tab } = await params;
    if (!isConnectionTab(tab)) return { title: "Not found", robots: { index: false } };

    const label = tab === "followers" ? "Followers" : "Following";
    return {
        title: `${label} · @${username}`,
        robots: { index: false, follow: true },
    };
}

export default function ConnectionsPage({ params }: Props) {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
                    Loading...
                </div>
            }
        >
            <ConnectionsContent params={params} />
        </Suspense>
    );
}

async function ConnectionsContent({ params }: Props) {
    const { username, tab } = await params;
    if (!isConnectionTab(tab)) notFound();

    return <ConnectionsView username={username} tab={tab} />;
}