import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    id: string;
};

export default function Field({ label, id, ...props }: FieldProps) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium">
                {label}
            </label>
            <input
                id={id}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
                {...props}
            />
        </div>
    );
}