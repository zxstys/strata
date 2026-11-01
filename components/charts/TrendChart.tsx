// components/charts/TrendChart.tsx
export type Day = { day: string; value: number };
export type Line = { label: string; color: string; data: Day[] };

const W = 640;
const H = 220;
const PAD_X = 36;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

const shortDay = (day: string) => day.slice(5); // "2026-10-31" -> "10-31"

export default function TrendChart({ lines }: { lines: Line[] }) {
    const days = lines[0]?.data ?? [];
    const last = days.length - 1;
    const max = Math.max(1, ...lines.flatMap((l) => l.data.map((p) => p.value)));

    const innerW = W - PAD_X * 2;
    const innerH = H - PAD_TOP - PAD_BOTTOM;

    const x = (i: number) =>
        PAD_X + (last > 0 ? (i * innerW) / last : innerW / 2);
    const y = (v: number) => PAD_TOP + innerH - (v / max) * innerH;

    const ticks = [0, 0.25, 0.5, 0.75, 1];
    const labelIdx = days.length === 0 ? [] : Array.from(new Set([0, Math.floor(last / 2), last]));

    return (
        <div className="flex flex-col gap-3">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Activity over time">
                {ticks.map((t) => {
                    const yy = y(max * t);
                    return (
                        <g key={t}>
                            <line
                                x1={PAD_X}
                                x2={W - PAD_X}
                                y1={yy}
                                y2={yy}
                                className="stroke-border"
                                strokeDasharray={t === 0 ? undefined : "3 4"}
                            />
                            <text x={PAD_X - 8} y={yy + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
                                {Math.round(max * t)}
                            </text>
                        </g>
                    );
                })}

                {lines.map((line) => (
                    <g key={line.label}>
                        <polyline
                            fill="none"
                            stroke={line.color}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            points={line.data.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
                        />
                        {line.data.map((p, i) => (
                            <circle key={p.day} cx={x(i)} cy={y(p.value)} r={3} fill={line.color}>
                                <title>{`${line.label} · ${shortDay(p.day)}: ${p.value}`}</title>
                            </circle>
                        ))}
                    </g>
                ))}

                {labelIdx.map((i) => (
                    <text
                        key={i}
                        x={x(i)}
                        y={H - 8}
                        textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
                        className="fill-muted-foreground text-[10px]"
                    >
                        {shortDay(days[i].day)}
                    </text>
                ))}
            </svg>

            <ul className="flex flex-wrap gap-4 text-xs">
                {lines.map((l) => (
                    <li key={l.label} className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ background: l.color }} />
                        {l.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}