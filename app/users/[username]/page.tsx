// app/users/[username]/page.tsx
import { Suspense } from "react";
import UserProfile from "./UserProfile";

export default function UserPage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-xl px-4 py-6">
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            }
        >
            <UserProfile params={params} />
        </Suspense>
    );
}