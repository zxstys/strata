// components/charts/Donut.tsx
export type Slice = { label: string; value: number; color: string };

const R = 40;
const C = 2 * Math.PI * R;

export default function Donut({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  let start = 0;
  const arcs = total === 0
    ? []
    : slices.map((slice) => {
        const len = (slice.value / total) * C;
        const arc = { slice, len, offset: start };
        start += len;
        return arc;
      });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="size-32 shrink-0 -rotate-90" role="img" aria-label="Account mix">
        <circle cx={50} cy={50} r={R} fill="none" strokeWidth={14} className="stroke-secondary" />
        {arcs.map(({ slice, len, offset }) => (
          <circle
            key={slice.label}
            cx={50}
            cy={50}
            r={R}
            fill="none"
            strokeWidth={14}
            stroke={slice.color}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
          >
            <title>{`${slice.label}: ${slice.value}`}</title>
          </circle>
        ))}
      </svg>

      <ul className="flex flex-col gap-2 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: s.color }} />
            <span className="w-20 text-muted-foreground">{s.label}</span>
            <span className="tabular-nums">{s.value}</span>
            <span className="text-xs text-muted-foreground">
              {total > 0 ? `${Math.round((s.value / total) * 100)}%` : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}