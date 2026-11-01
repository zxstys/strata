// components/support/StatusPill.tsx
import type { TicketStatus } from "@/lib/support/support";

const STYLE: Record<TicketStatus, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-secondary text-muted-foreground" },
    in_progress: { label: "In progress", className: "bg-sky-500/10 text-sky-600" },
    resolved: { label: "Resolved", className: "bg-emerald-500/10 text-emerald-600" },
    rejected: { label: "Declined", className: "bg-red-500/10 text-red-600" },
};

export default function StatusPill({ status }: { status: TicketStatus }) {
    const { label, className } = STYLE[status];
    return (
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
            {label}
        </span>
    );
}