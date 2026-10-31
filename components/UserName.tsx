// components/UserName.tsx
import { BadgeIcon } from "@/components/VerifiedBadge";
import { profilePath } from "@/lib/profile-link";
import type { Author } from "@/types/post";
import Link from "next/link";

// Gold overrides blue. Renders nothing for unverified users.
export function VerifiedBadge({
    verified,
    gold,
    className = "",
}: {
    verified: boolean;
    gold: boolean;
    className?: string;
}) {
    if (gold) return <BadgeIcon kind="gold" className={className} />;
    if (verified) return <BadgeIcon kind="blue" className={className} />;
    return null;
}

export function UserName({
    author,
    className = "",
}: {
    author: Pick<Author, "id" | "name" | "username" | "verified" | "gold">;
    className?: string;
}) {
    return (
        <Link
            href={profilePath(author)}
            className={`inline-flex items-center gap-1 font-medium hover:underline ${className}`}
        >
            {author.name}
            <VerifiedBadge verified={author.verified} gold={author.gold} />
        </Link>
    );
}