// app/posts/[uuid]/page.tsx
import JsonLd from "@/components/JsonLd";
import { getPublicPost } from "@/lib/seo/seo-data";
import { plainExcerpt } from "@/lib/seo/seo-text";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import { Suspense } from "react";
import PostView from "./PostView";

type Props = { params: Promise<{ uuid: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { uuid } = await params;
    const post = await getPublicPost(uuid);

    if (!post) {
        return {
            title: "Post not found",
            robots: { index: false, follow: false },
        };
    }

    const title = `Post by ${post.author.name}`;
    const description =
        plainExcerpt(post.content) || `A post by ${post.author.name} on ${SITE_NAME}.`;
    const image = post.mediaUrl ?? post.author.image ?? undefined;
    const url = `/posts/${post.uuid}`;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            type: "article",
            title,
            description,
            url,
            siteName: SITE_NAME,
            publishedTime: post.createdAt,
            images: image ? [image] : undefined,
        },
        twitter: {
            card: image ? "summary_large_image" : "summary",
            title,
            description,
            images: image ? [image] : undefined,
        },
    };
}

export default function PostPage({ params }: Props) {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
                    Loading...
                </div>
            }
        >
            <PostContent params={params} />
        </Suspense>
    );
}

async function PostContent({ params }: Props) {
    const { uuid } = await params;
    const post = await getPublicPost(uuid);

    return (
        <>
            {post && (
                <JsonLd
                    data={{
                        "@context": "https://schema.org",
                        "@type": "SocialMediaPosting",
                        headline: `Post by ${post.author.name}`,
                        articleBody: post.content,
                        datePublished: post.createdAt,
                        url: absoluteUrl(`/posts/${post.uuid}`),
                        image: post.mediaUrl ?? undefined,
                        author: {
                            "@type": "Person",
                            name: post.author.name,
                            url: absoluteUrl(`/users/${post.author.username ?? post.author.id}`),
                        },
                        interactionStatistic: [
                            {
                                "@type": "InteractionCounter",
                                interactionType: "https://schema.org/LikeAction",
                                userInteractionCount: post.likes,
                            },
                            {
                                "@type": "InteractionCounter",
                                interactionType: "https://schema.org/CommentAction",
                                userInteractionCount: post.comments,
                            },
                        ],
                    }}
                />
            )}
            <PostView uuid={uuid} initial={post} />
        </>
    );
}