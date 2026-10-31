// app/settings/verification/page.tsx
"use client";

import { BadgeIcon } from "@/components/VerifiedBadge";
import { authClient } from "@/lib/auth-client";
import { fetcher } from "@/lib/fetcher";
import { profilePath } from "@/lib/profile-link";
import type { MyProfile } from "@/types/user";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import useSWR from "swr";

type Notice = { ok: boolean; text: string } | null;

export default function VerificationPage() {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const { data: me, error, mutate } = useSWR<MyProfile>("/api/profile", fetcher);

    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);

    const back = () => {
        if (window.history.length > 1) router.back();
        else router.push(session?.user ? profilePath(session.user) : "/");
    };

    const setGold = async (on: boolean) => {
        setBusy(true);
        setNotice(null);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ goldEnabled: on }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message ?? "Something went wrong.");
            await mutate();
            setNotice({
                ok: true,
                text: on ? "Gold checkmark is on." : "Gold checkmark is off.",
            });
        } catch (err) {
            setNotice({
                ok: false,
                text: err instanceof Error ? err.message : "Something went wrong.",
            });
        } finally {
            setBusy(false);
        }
    };

    const topBar = (
        <div className="flex items-center justify-between gap-3">
            <button
                type="button"
                onClick={back}
                className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
            >
                <LuArrowLeft className="size-4" />
                Back
            </button>
            <Link
                href="/settings/profile"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                Edit profile
            </Link>
        </div>
    );

    if (error) {
        return (
            <div className="flex flex-col gap-6 max-w-xl mx-auto">
                {topBar}
                <p className="text-sm text-muted-foreground">
                    <Link href="/auth/login" className="font-medium text-foreground hover:underline">
                        Sign in
                    </Link>{" "}
                    to manage verification.
                </p>
            </div>
        );
    }

    if (!me) {
        return (
            <div className="flex flex-col gap-6 max-w-xl mx-auto">
                {topBar}
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        );
    }

    const goldShowing = me.goldPermission && me.goldEnabled;

    return (
        <div className="flex flex-col gap-6 max-w-xl w-full mx-auto my-8">
            {topBar}

            <div>
                <h2 className="text-lg font-semibold tracking-tight">Verification</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Badges show next to your name across Strata.
                </p>
            </div>

            {/* Blue */}
            <section className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
                <div className="flex gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                        {me.verified ? (
                            <BadgeIcon kind="blue" className="size-5" />
                        ) : (
                            <span className="size-3 rounded-full bg-border" />
                        )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium">Blue checkmark</p>
                        <p className="text-sm text-muted-foreground">
                            {me.verified
                                ? "Strata has verified your account."
                                : "Granted by Strata to verify accounts. You can't turn this on yourself."}
                        </p>
                    </div>
                </div>

                <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${me.verified
                        ? "bg-sky-500/10 text-sky-600"
                        : "bg-secondary text-muted-foreground"
                        }`}
                >
                    {me.verified ? "Verified" : "Not verified"}
                </span>
            </section>

            {/* Gold */}
            <section className="flex flex-col gap-4 rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                            {goldShowing ? (
                                <BadgeIcon kind="gold" className="size-5" />
                            ) : (
                                <span className="size-3 rounded-full bg-border" />
                            )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-medium">Gold checkmark</p>
                            <p className="text-sm text-muted-foreground">
                                {!me.goldPermission
                                    ? "Available to selected accounts. Ask a Strata admin for access."
                                    : me.goldEnabled
                                        ? "Showing next to your name. Turn it off to hide it."
                                        : "You have access. Turn it on to show it next to your name."}
                            </p>
                        </div>
                    </div>

                    {me.goldPermission ? (
                        <button
                            type="button"
                            role="switch"
                            aria-checked={me.goldEnabled}
                            aria-label="Show gold checkmark"
                            onClick={() => setGold(!me.goldEnabled)}
                            disabled={busy}
                            className={`relative inline-block h-7 w-12 shrink-0 rounded-full p-0 transition-colors disabled:opacity-50 ${me.goldEnabled ? "bg-amber-500" : "bg-secondary ring-1 ring-border"
                                }`}
                        >
                            <span
                                className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200 ${me.goldEnabled ? "translate-x-5" : "translate-x-0"
                                    }`}
                            />
                        </button>
                    ) : (
                        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            Locked
                        </span>
                    )}
                </div>
            </section>

            {notice && (
                <p
                    role="status"
                    className={`text-sm ${notice.ok ? "text-muted-foreground" : "text-red-500"}`}
                >
                    {notice.text}
                </p>
            )}
        </div>
    );
}