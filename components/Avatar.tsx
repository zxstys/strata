// components/Avatar.tsx
type Props = {
    name: string;
    src?: string | null;
    size?: "sm" | "lg";
};

const SIZES = {
    sm: "size-8 text-sm",
    lg: "size-20 text-2xl ring-4 ring-background",
};

export default function Avatar({ name, src, size = "sm" }: Props) {
    const base = `shrink-0 rounded-full object-cover ${SIZES[size]}`;

    if (src) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt="" className={base} />;
    }

    return (
        <div className={`flex items-center justify-center bg-secondary font-medium ${base}`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}