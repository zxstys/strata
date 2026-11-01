// lib/image-crop.ts
export type Crop = {
    zoom: number; // 1 = base size, up to 4
    panX: number; // offset as a fraction of frame width
    panY: number; // offset as a fraction of frame height
    mode: "fill" | "fit";
};

export const defaultCrop = (): Crop => ({ zoom: 1, panX: 0, panY: 0, mode: "fill" });

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function metrics(nw: number, nh: number, W: number, H: number, crop: Crop) {
    // fill: cover the frame. fit: show the whole image inside the frame.
    const base =
        crop.mode === "fill" ? Math.max(W / nw, H / nh) : Math.min(W / nw, H / nh);
    const dw = nw * base * crop.zoom;
    const dh = nh * base * crop.zoom;
    return {
        dw,
        dh,
        maxX: Math.max(0, (dw - W) / 2),
        maxY: Math.max(0, (dh - H) / 2),
    };
}

// Keeps the pan inside the image bounds so the frame never shows an empty gap
// when the image is larger than the frame.
export function clampCrop(crop: Crop, nw: number, nh: number, W: number, H: number): Crop {
    const { maxX, maxY } = metrics(nw, nh, W, H, crop);
    return {
        ...crop,
        panX: clamp(crop.panX, -maxX / W, maxX / W),
        panY: clamp(crop.panY, -maxY / H, maxY / H),
    };
}

// Where to draw the image inside a W×H frame.
export function layout(nw: number, nh: number, W: number, H: number, crop: Crop) {
    const { dw, dh, maxX, maxY } = metrics(nw, nh, W, H, crop);
    const px = clamp(crop.panX * W, -maxX, maxX);
    const py = clamp(crop.panY * H, -maxY, maxY);
    return { x: (W - dw) / 2 + px, y: (H - dh) / 2 + py, w: dw, h: dh };
}

// Renders the crop to a JPEG blob at the output size. Call in the browser only.
export function renderCrop(
    img: HTMLImageElement,
    W: number,
    H: number,
    crop: Crop
): Promise<Blob> {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.reject(new Error("Image editing isn't supported in this browser."));

    // White behind the image, so "Fit" leaves no transparent areas.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const p = layout(img.naturalWidth, img.naturalHeight, W, H, crop);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, p.x, p.y, p.w, p.h);

    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't prepare that image."))),
            "image/jpeg",
            0.9
        )
    );
}