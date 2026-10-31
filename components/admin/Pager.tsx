// components/admin/Pager.tsx
export default function Pager({
    page,
    hasMore,
    onChange,
}: {
    page: number;
    hasMore: boolean;
    onChange: (page: number) => void;
}) {
    const btn =
        "rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-hover disabled:opacity-40";

    return (
        <div className="flex items-center justify-between pt-2">
            <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
                Previous
            </button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <button className={btn} disabled={!hasMore} onClick={() => onChange(page + 1)}>
                Next
            </button>
        </div>
    );
}