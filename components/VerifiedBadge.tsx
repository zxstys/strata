// components/VerifiedBadge.tsx

export type BadgeKind = "blue" | "gold";

const LABEL: Record<BadgeKind, string> = {
    blue: "Verified",
    gold: "Gold verified",
};

const FILL: Record<BadgeKind, string> = {
    blue: "fill-sky-500",
    gold: "fill-amber-500",
};

// Builds a scalloped circle: a radius that rises and falls around the
// circumference. 10 waves and a moderate amplitude give the X-style edge.
function buildScallop(waves = 10, radius = 9.6, amplitude = 0.7, steps = 160) {
    const c = 12;
    let d = "";
    for (let i = 0; i < steps; i++) {
        const t = (2 * Math.PI * i) / steps;
        const r = radius + amplitude * Math.cos(waves * t);
        const x = c + r * Math.cos(t);
        const y = c + r * Math.sin(t);
        d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return `${d}Z`;
}

const SCALLOP_PATH = buildScallop();

export function BadgeIcon({
    kind,
    className,
}: {
    kind: BadgeKind;
    className?: string;
}) {
    return (
        <svg
            role="img"
            aria-label={LABEL[kind]}
            viewBox="0 0 24 24"
            className={`inline-block shrink-0 align-[-0.125em] ${className || "size-4"}`}
        >
            <title>{LABEL[kind]}</title>
            <path d={SCALLOP_PATH} className={FILL[kind]} />
            <path
                d="M7.6 12.4l2.9 2.9 5.9-6.1"
                fill="none"
                stroke="#ffffff"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}