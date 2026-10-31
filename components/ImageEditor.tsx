// components/ImageEditor.tsx
"use client";

import {
    clampCrop,
    defaultCrop,
    layout,
    renderCrop,
    type Crop,
} from "@/lib/image-crop";
import { useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";

export type EditorShape = "square" | "wide";

const OUTPUT = {
    square: { w: 512, h: 512 },
    wide: { w: 1500, h: 500 },
} as const;

const PREVIEW_W = 280;

export default function ImageEditor({
    file,
    shape,
    title,
    onCancel,
    onConfirm,
}: {
    file: File;
    shape: EditorShape;
    title: string;
    onCancel: () => void;
    // Throw to show an error in the editor. Unmount the editor on success.
    onConfirm: (cropped: File) => Promise<void>;
}) {
    const [img, setImg] = useState<HTMLImageElement | null>(null);
    const [crop, setCrop] = useState<Crop>(defaultCrop);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const drag = useRef<{ x: number; y: number } | null>(null);

    const previewH = shape === "square" ? PREVIEW_W : Math.round(PREVIEW_W / 3);

    useEffect(() => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => setImg(image);
        image.onerror = () =>
            setError("This image couldn't be opened. Try a JPG, PNG, or WebP file.");
        image.src = url;
        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !saving) onCancel();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onCancel, saving]);

    const update = (next: Partial<Crop>) => {
        if (!img) return;
        setCrop((c) =>
            clampCrop({ ...c, ...next }, img.naturalWidth, img.naturalHeight, PREVIEW_W, previewH)
        );
    };

    const pos = img
        ? layout(img.naturalWidth, img.naturalHeight, PREVIEW_W, previewH, crop)
        : null;

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!drag.current || !img) return;
        const dx = (e.clientX - drag.current.x) / PREVIEW_W;
        const dy = (e.clientY - drag.current.y) / previewH;
        drag.current = { x: e.clientX, y: e.clientY };
        setCrop((c) =>
            clampCrop(
                { ...c, panX: c.panX + dx, panY: c.panY + dy },
                img.naturalWidth,
                img.naturalHeight,
                PREVIEW_W,
                previewH
            )
        );
    };

    const endDrag = () => {
        drag.current = null;
    };

    const confirm = async () => {
        if (!img) return;
        setSaving(true);
        setError("");
        try {
            const out = OUTPUT[shape];
            const blob = await renderCrop(img, out.w, out.h, crop);
            await onConfirm(new File([blob], `${shape}.jpg`, { type: "image/jpeg" }));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
            setSaving(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
            <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-background p-5 shadow-xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">{title}</h2>
                    <button
                        onClick={onCancel}
                        disabled={saving}
                        aria-label="Close"
                        className="rounded-full p-1.5 hover:bg-hover disabled:opacity-50"
                    >
                        <LuX />
                    </button>
                </div>

                <div className="flex justify-center">
                    <div
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        style={{ width: PREVIEW_W, height: previewH }}
                        className={`relative touch-none select-none overflow-hidden ${crop.mode === "fit" ? "bg-white" : "bg-secondary"
                            } ${shape === "square" ? "rounded-full" : "rounded-lg"} ${img ? "cursor-grab active:cursor-grabbing" : ""
                            }`}
                    >
                        {img && pos && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={img.src}
                                alt=""
                                draggable={false}
                                className="pointer-events-none absolute max-w-none"
                                style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h }}
                            />
                        )}
                    </div>
                </div>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="flex justify-between">
                        <span>Zoom</span>
                        <span className="text-muted-foreground">{crop.zoom.toFixed(1)}×</span>
                    </span>
                    <input
                        type="range"
                        min={1}
                        max={4}
                        step={0.01}
                        value={crop.zoom}
                        disabled={!img || saving}
                        onChange={(e) => update({ zoom: Number(e.target.value) })}
                    />
                </label>

                <div className="flex gap-2">
                    <div
                        role="group"
                        aria-label="Fit mode"
                        className="flex flex-1 rounded-md border border-border p-0.5"
                    >
                        {(["fill", "fit"] as const).map((m) => (
                            <button
                                key={m}
                                type="button"
                                aria-pressed={crop.mode === m}
                                onClick={() => update({ mode: m })}
                                className={`flex-1 rounded px-3 py-1.5 text-sm transition-colors ${crop.mode === m
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-hover"
                                    }`}
                            >
                                {m === "fill" ? "Fill" : "Fit"}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setCrop(defaultCrop())}
                        className="rounded-md border border-border px-3 text-sm hover:bg-hover"
                    >
                        Reset
                    </button>
                </div>

                <p className="text-xs text-muted-foreground">
                    {crop.mode === "fill"
                        ? "Fill covers the frame and crops the edges."
                        : "Fit shows the whole image with white space around it."}{" "}
                    Drag to reposition.
                </p>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={saving}
                        className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-hover disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirm}
                        disabled={!img || saving}
                        className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}