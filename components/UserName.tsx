// components/UserName.tsx
import { BadgeIcon } from "@/components/VerifiedBadge";
import { profilePath } from "@/lib/post/profile-link";
import type { Author } from "@/types/post";
import Link from "next/link";

type BadgeFlags = { verified: boolean; gold: boolean; mod?: boolean };

// Priority: moderator, then gold, then blue.
export function VerifiedBadge({
    verified,
    gold,
    mod = false,
    className = "",
}: BadgeFlags & { className?: string }) {
    if (mod) return <BadgeIcon kind="mod" className={className} />;
    if (gold) return <BadgeIcon kind="gold" className={className} />;
    if (verified) return <BadgeIcon kind="blue" className={className} />;
    return null;
}

export function UserName({
    author,
    className = "",
}: {
    author: Pick<Author, "id" | "name" | "username" | "verified" | "gold"> & { mod?: boolean };
    className?: string;
}) {
    return (
        <Link
            href={profilePath(author)}
            className={`inline-flex items-center gap-1 font-medium hover:underline ${className}`}
        >
            {author.name}
            <VerifiedBadge verified={author.verified} gold={author.gold} mod={author.mod} />
        </Link>
    );
}