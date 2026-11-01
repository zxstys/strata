// app/users/[username]/page.tsx
import JsonLd from "@/components/JsonLd";
import { getPublicUserMeta } from "@/lib/seo/seo-data";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";
import { Suspense } from "react";
import UserProfile from "./UserProfile";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params;
    const u = await getPublicUserMeta(username);

    if (!u) {
        return {
            title: "User not found",
            robots: { index: false, follow: false },
        };
    }

    const handle = u.username ?? username;
    const title = `${u.name} (@${handle})`;
    const description = u.about || `${u.name} on ${SITE_NAME}.`;
    const url = `/users/${handle}`;
    const image = u.image ?? undefined;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            type: "profile",
            title,
            description,
            url,
            siteName: SITE_NAME,
            images: image ? [image] : undefined,
        },
        twitter: {
            card: "summary",
            title,
            description,
            images: image ? [image] : undefined,
        },
    };
}

export default function UserPage({ params }: Props) {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-xl px-4 py-6 text-sm text-muted-foreground">
                    Loading...
                </div>
            }
        >
            <UserContent params={params} />
        </Suspense>
    );
}

async function UserContent({ params }: Props) {
    const { username } = await params;
    const u = await getPublicUserMeta(username);

    return (
        <>
            {u && (
                <JsonLd
                    data={{
                        "@context": "https://schema.org",
                        "@type": "ProfilePage",
                        mainEntity: {
                            "@type": "Person",
                            name: u.name,
                            alternateName: u.username ? `@${u.username}` : undefined,
                            description: u.about || undefined,
                            image: u.image ?? undefined,
                            url: absoluteUrl(`/users/${u.username ?? username}`),
                        },
                    }}
                />
            )}
            <UserProfile params={params} />
        </>
    );
}