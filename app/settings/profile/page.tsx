// app/settings/profile/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { LuArrowLeft, LuBadgeCheck } from "react-icons/lu";

import Avatar from "@/components/Avatar";
import ImageEditor from "@/components/ImageEditor";
import { authClient } from "@/lib/auth-client";
import { fetcher } from "@/lib/fetcher";
import { profilePath } from "@/lib/profile-link";
import { uploadMedia } from "@/lib/upload-client";
import { normalizeUsername, validateUsername } from "@/lib/username";
import type { MyProfile } from "@/types/user";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";

const ABOUT_MAX = 160;
type MediaKind = "avatar" | "banner";

export default function EditProfilePage() {
    const { data: session } = authClient.useSession();
    const { data: me, error, mutate } = useSWR<MyProfile>("/api/profile", fetcher);

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [about, setAbout] = useState("");
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState<{ kind: MediaKind; file: File } | null>(null);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (me) {
            setName(me.name);
            setUsername(me.username ?? "");
            setAbout(me.about);
        }
    }, [me]);

    const patch = async (body: Record<string, unknown>) => {
        const res = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message ?? "Something went wrong.");
        await mutate();
    };

    // Called when the user picks a file. Opens the editor instead of uploading.
    const pick = (kind: MediaKind, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // lets the same file be picked again
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMessage({ ok: false, text: "Choose an image file." });
            return;
        }

        setMessage(null);
        setEditing({ kind, file });
    };

    // Called by the editor with the cropped JPEG. Throwing keeps the editor open with the error.
    const applyMedia = async (kind: MediaKind, cropped: File) => {
        const url = await uploadMedia(cropped, kind);

        // The API stores the avatar in the `image` column, so map the key explicitly.
        await patch(kind === "avatar" ? { image: url } : { banner: url });

        authClient.$store.notify("$sessionSignal");

        setEditing(null);
        setMessage({
            ok: true,
            text: kind === "avatar" ? "Profile picture updated." : "Banner updated.",
        });
    };

    const saveProfile = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const cleaned = normalizeUsername(username);
            const problem = validateUsername(cleaned);
            if (problem) throw new Error(problem);

            await patch({ name: name.trim(), username: cleaned, about: about.trim() });
            setUsername(cleaned);
            setMessage({ ok: true, text: "Profile saved." });
        } catch (err) {
            setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong." });
        } finally {
            setSaving(false);
        }
    };

    if (error) {
        return (
            <p className="text-sm text-muted-foreground">
                <Link href="/auth/login" className="font-medium text-foreground hover:underline">
                    Sign in
                </Link>{" "}
                to edit your profile.
            </p>
        );
    }

    if (!me) return <p className="text-sm text-muted-foreground">Loading...</p>;

    const unchanged =
        name.trim() === me.name &&
        normalizeUsername(username) === (me.username ?? "") &&
        about.trim() === me.about;

    const publicHref = profilePath({ id: session?.user.id ?? "", username: me.username });

    return (
        <div className="flex flex-col gap-6 max-w-xl mx-auto my-8">
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => {
                        // Go back in history if possible, otherwise open the public profile.
                        if (window.history.length > 1) router.back();
                        else router.push(publicHref);
                    }}
                    className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                >
                    <LuArrowLeft className="size-4" />
                    Back
                </button>

                <Link
                    href="/settings/verification"
                    className="flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-hover"
                >
                    <LuBadgeCheck className="size-4" />
                    Verification
                </Link>
            </div>

            {editing && (
                <ImageEditor
                    key={`${editing.kind}-${editing.file.name}-${editing.file.size}`}
                    file={editing.file}
                    shape={editing.kind === "avatar" ? "square" : "wide"}
                    title={editing.kind === "avatar" ? "Edit profile picture" : "Edit banner"}
                    onCancel={() => setEditing(null)}
                    onConfirm={(cropped) => applyMedia(editing.kind, cropped)}
                />
            )}

            {!me.username && (
                <p className="rounded-md border border-border bg-secondary p-3 text-sm">
                    Choose a username so people can find your profile and see your name as a link.
                </p>
            )}

            <section className="overflow-hidden rounded-lg border border-border">
                <div className="relative bg-secondary" style={{ aspectRatio: "3 / 1" }}>
                    {me.banner && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={me.banner} alt="" className="h-full w-full object-cover" />
                    )}
                    <label className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-background/80 px-3 py-1 text-xs font-medium hover:bg-background">
                        Change banner
                        <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => pick("banner", e)}
                        />
                    </label>
                </div>

                <div className="-mt-10 flex items-end gap-3 px-4 pb-4">
                    <div className="relative">
                        <Avatar name={me.name} src={me.image} size="lg" />
                        <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-background px-2 py-1 text-xs font-medium ring-1 ring-border hover:bg-hover">
                            Change
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => pick("avatar", e)}
                            />
                        </label>
                    </div>
                </div>
            </section>

            <p className="-mt-3 text-xs text-muted-foreground">
                Pick a photo, then drag to position it, use the zoom slider, and choose Fill or Fit before saving.
            </p>

            <section className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Name
                    <input
                        value={name}
                        maxLength={50}
                        onChange={(e) => setName(e.target.value)}
                        className="h-10 rounded-md border border-border bg-background px-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    Username
                    <div className="flex items-center rounded-md border border-border bg-background focus-within:ring-2 focus-within:ring-ring">
                        <span className="pl-3 text-sm text-muted-foreground px-2">@</span>
                        <input
                            value={username}
                            maxLength={20}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="your_name"
                            className="h-10 w-full bg-transparent px-1 pr-3 border-0 ring-0 text-sm font-normal focus:outline-none"
                        />
                    </div>
                    <span className="text-xs font-normal text-muted-foreground">
                        Letters, numbers, and underscores. 3 to 20 characters.
                    </span>
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium">
                    About
                    <textarea
                        value={about}
                        maxLength={ABOUT_MAX}
                        rows={4}
                        onChange={(e) => setAbout(e.target.value)}
                        className="resize-none rounded-md border border-border bg-background p-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="self-end text-xs font-normal text-muted-foreground">
                        {about.length}/{ABOUT_MAX}
                    </span>
                </label>

                <div className="flex items-center justify-between gap-3">
                    <Link href={publicHref} className="text-sm text-muted-foreground hover:text-foreground">
                        View public profile
                    </Link>
                    <button
                        onClick={saveProfile}
                        disabled={saving || unchanged || !name.trim()}
                        className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save profile"}
                    </button>
                </div>
            </section>

            {message && (
                <p role="status" className={`text-sm ${message.ok ? "text-muted-foreground" : "text-red-500"}`}>
                    {message.text}
                </p>
            )}
        </div>
    );
}