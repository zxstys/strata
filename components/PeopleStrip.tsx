// components/PeopleStrip.tsx
"use client";

import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import { UserName } from "@/components/UserName";
import { profilePath } from "@/lib/profile-link";
import { usePeople } from "@/lib/search-client";
import Link from "next/link";

export default function PeopleStrip() {
    const { data, error, isLoading, mutate } = usePeople();

    if (error) return null;

    return (
        <section className="flex min-w-0 flex-col gap-2">
            <h2 className="text-sm font-medium">People</h2>

            {isLoading && (
                <p className="text-sm text-muted-foreground">Loading people...</p>
            )}

            {data && data.length === 0 && (
                <p className="text-sm text-muted-foreground">No people to show yet.</p>
            )}

            {data && data.length > 0 && (
                // Mobile: horizontal scroll row, bleeding to the screen edges.
                // Desktop (lg+): vertical list in the sidebar.
                <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
                    {data.map((person) => (
                        <div
                            key={person.id}
                            className="flex w-44 shrink-0 flex-col gap-3 rounded-lg border border-border p-3 lg:w-full"
                        >
                            <div className="flex items-center gap-2">
                                <Link
                                    href={profilePath(person)}
                                    aria-label={`${person.name}'s profile`}
                                    className="shrink-0 rounded-full transition-opacity hover:opacity-80"
                                >
                                    <Avatar name={person.name} src={person.image} />
                                </Link>
                                <div className="min-w-0">
                                    <UserName author={person} className="truncate text-sm" />
                                    {person.username && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            @{person.username}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <FollowButton
                                userId={person.id}
                                following={person.isFollowing}
                                onChanged={() => mutate()}
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}