// components/MentionTextarea.tsx
"use client";

import Avatar from "@/components/Avatar";
import type { DraftStore } from "@/lib/composer/draft-store";
import { useUserSuggest } from "@/lib/user/suggest-client";
import type { DmUser } from "@/types/dm";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from "react";

type Props = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "defaultValue" | "onChange"
> & {
  store: DraftStore;
};

// Matches an @ token that ends at the caret, such as "hi @an" -> "an".
const MENTION_BEFORE_CARET = /(?:^|\s)@([A-Za-z0-9_]{0,20})$/;

function mentionQuery(el: HTMLTextAreaElement): string | null {
  const match = el.value.slice(0, el.selectionStart).match(MENTION_BEFORE_CARET);
  return match ? match[1] : null;
}

export default function MentionTextarea({
  store,
  className = "",
  onKeyDown,
  onBlur,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Only the mention query is React state. Ordinary typing never changes it,
  // so regular keystrokes don't re-render this component.
  const [query, setQuery] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(0);

  const { data } = useUserSuggest(query ?? "");
  const suggestions = query !== null && !dismissed ? data ?? [] : [];
  const index = Math.min(active, Math.max(suggestions.length - 1, 0));
  const open = suggestions.length > 0;

  // When the store is reset from outside (after posting), update the DOM to match.
  useEffect(() => {
    return store.subscribe(() => {
      const el = ref.current;
      if (el && el.value !== store.get()) {
        el.value = store.get();
        setQuery(null);
      }
    });
  }, [store]);

  const updateQuery = (el: HTMLTextAreaElement) => {
    const next = mentionQuery(el);
    if (next === null) setDismissed(false);
    if (next !== query) {
      setActive(0);
      setQuery(next);
    }
  };

  const handleInput = (el: HTMLTextAreaElement) => {
    store.set(el.value);
    updateQuery(el);
  };

  const choose = (user: DmUser) => {
    const el = ref.current;
    if (!el || !user.username) return;

    const caret = el.selectionStart;
    const at = el.value.slice(0, caret).lastIndexOf("@");
    if (at === -1) return;

    const insert = `@${user.username} `;
    const next = el.value.slice(0, at) + insert + el.value.slice(caret);
    const pos = at + insert.length;

    el.value = next;
    el.setSelectionRange(pos, pos);
    store.set(next);
    setQuery(null);
    setDismissed(false);
    el.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (open && !e.nativeEvent.isComposing) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActive((index + 1) % suggestions.length);
          return;
        case "ArrowUp":
          e.preventDefault();
          setActive((index - 1 + suggestions.length) % suggestions.length);
          return;
        case "Enter":
        case "Tab":
          e.preventDefault();
          choose(suggestions[index]);
          return;
        case "Escape":
          e.preventDefault();
          setDismissed(true);
          return;
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative">
      <textarea
        {...rest}
        ref={ref}
        defaultValue=""
        className={className}
        onInput={(e) => handleInput(e.currentTarget)}
        onSelect={(e) => updateQuery(e.currentTarget)}
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          setQuery(null);
          onBlur?.(e);
        }}
      />

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === index}
              // mousedown keeps focus in the textarea while a name is picked
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${i === index ? "bg-hover" : ""
                }`}
            >
              <Avatar name={s.name} src={s.image} />
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">@{s.username}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}