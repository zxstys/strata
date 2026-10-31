// components/MediaInput.tsx
"use client";

import { useEffect, useState } from "react";
import { LuImagePlus, LuX } from "react-icons/lu";

export default function MediaInput({
    accept,
    file,
    onChange,
    label = "Add media",
}: {
    accept: string;
    file: File | null;
    onChange: (file: File | null) => void;
    label?: string;
}) {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="flex flex-col gap-2">
            {preview && (
                <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={preview}
                        alt=""
                        className="max-h-72 w-full rounded-xl border border-border object-cover"
                    />
                    <button
                        type="button"
                        aria-label="Remove attachment"
                        onClick={() => onChange(null)}
                        className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 hover:bg-background"
                    >
                        <LuX />
                    </button>
                </div>
            )}

            {!file && (
                <label
                    aria-label={label}
                    className="inline-flex w-fit cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
                >
                    <LuImagePlus />
                    <input
                        type="file"
                        accept={accept}
                        className="sr-only"
                        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                    />
                </label>
            )}
        </div>
    );
}