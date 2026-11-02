// components/Markdown.tsx
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { linkify } from "./Linkify";

const heading: Components["h1"] = ({ children }) => (
    <p className="mb-1 font-semibold">{linkify(children)}</p>
);

const components: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{linkify(children)}</p>,
    h1: heading,
    h2: heading,
    h3: heading,
    h4: heading,
    h5: heading,
    h6: heading,
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
            className="break-all text-primary underline underline-offset-2 hover:opacity-80"
        >
            {children}
        </a>
    ),
    // Images aren't rendered from markdown. Uploads go through the attachment field.
    img: ({ alt }) => (
        <span className="text-muted-foreground">[image{alt ? `: ${alt}` : ""}]</span>
    ),
    ul: ({ children }) => <ul className="mb-2 list-disc pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 list-decimal pl-5">{children}</ol>,
    li: ({ children }) => <li className="mt-0.5">{linkify(children)}</li>,
    blockquote: ({ children }) => (
        <blockquote className="mb-2 border-l-2 border-border pl-3 text-muted-foreground">
            {children}
        </blockquote>
    ),
    pre: ({ children }) => (
        <pre className="mb-2 overflow-x-auto rounded-md bg-secondary p-3 text-xs">
            {children}
        </pre>
    ),
    code: ({ children }) => (
        <code className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.85em] [pre_&]:bg-transparent [pre_&]:p-0">
            {children}
        </code>
    ),
    hr: () => <hr className="my-3 border-border" />,
    table: ({ children }) => (
        <div className="mb-2 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">{children}</table>
        </div>
    ),
    th: ({ children }) => (
        <th className="border-b border-border px-2 py-1 font-medium">{children}</th>
    ),
    td: ({ children }) => (
        <td className="border-b border-border px-2 py-1">{children}</td>
    ),
};

export default function Markdown({ children }: { children: string }) {
    return (
        <div className="break-words text-sm leading-relaxed">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={components}
                skipHtml
            >
                {children}
            </ReactMarkdown>
        </div>
    );
}

export function MarkdownHint() {
    return (
        <p className="text-xs text-muted-foreground">
            Supports **bold**, *italic*, `code`, lists, quotes, and links.
        </p>
    );
}