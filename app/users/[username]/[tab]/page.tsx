// app/users/[username]/[tab]/page.tsx
import { Suspense } from "react";
import ConnectionsView from "./ConnectionsView";

export default function ConnectionsPage({
    params,
}: {
    params: Promise<{ username: string; tab: string }>;
}) {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
                    Loading...
                </div>
            }
        >
            <ConnectionsView params={params} />
        </Suspense>
    );
}