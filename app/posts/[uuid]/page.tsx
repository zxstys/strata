// app/posts/[uuid]/page.tsx
import { Suspense } from "react";
import PostView from "./PostView";

export default function PostPage({
    params,
}: {
    params: Promise<{ uuid: string }>;
}) {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
                    Loading...
                </div>
            }
        >
            <PostView params={params} />
        </Suspense>
    );
}