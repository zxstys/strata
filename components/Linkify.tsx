// components/Linkify.tsx
import { tokenize } from "@/lib/text/entities";
import Link from "next/link";
import {
    Children,
    cloneElement,
    isValidElement,
    type ReactNode,
} from "react";

// Elements whose contents should never be linkified.
const SKIP = new Set(["a", "code", "pre"]);

export function linkifyText(text: string): ReactNode[] {
    return tokenize(text).map((t, i) => {
        if (t.type === "text") return t.value;

        const isTag = t.type === "tag";
        return (
            <Link
                key={i}
                href={isTag ? `/tags/${t.value}` : `/users/${t.value}`}
                className="font-medium text-sky-600 hover:underline dark:text-sky-400"
            >
                {isTag ? `#${t.value}` : `@${t.value}`}
            </Link>
        );
    });
}

// Walks React children, linkifying string nodes and leaving links and code alone.
export function linkify(children: ReactNode): ReactNode {
    return Children.map(children, (child) => {
        if (typeof child === "string") return linkifyText(child);

        if (
            isValidElement<{ children?: ReactNode }>(child) &&
            child.props.children !== undefined
        ) {
            if (typeof child.type === "string" && SKIP.has(child.type)) return child;
            return cloneElement(child, undefined, linkify(child.props.children));
        }

        return child;
    });
}