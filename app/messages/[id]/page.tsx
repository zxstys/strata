// app/messages/[id]/page.tsx
import { Suspense } from "react";
import ThreadView from "./ThreadView";

type Props = { params: Promise<{ id: string }> };

export default function ThreadPage({ params }: Props) {
    return (
        <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading...</p>}>
            <ThreadContent params={params} />
        </Suspense>
    );
}

async function ThreadContent({ params }: Props) {
    const { id } = await params;
    return <ThreadView id={id} />;
}