// app/tags/[tag]/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import TagView from "./TagView";

type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag}`,
    description: `Posts tagged #${tag} on Strata.`,
    alternates: { canonical: `/tags/${tag}` },
  };
}

export default function TagPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">Loading...</div>}>
      <TagContent params={params} />
    </Suspense>
  );
}

async function TagContent({ params }: Props) {
  const { tag } = await params;
  return <TagView tag={tag.toLowerCase()} />;
}