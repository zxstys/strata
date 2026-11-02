// lib/composer/draft-store.ts

// A small external store for composer text. Typing writes to the store, and only
// components that subscribe to it re-render. Nothing else on the page does.
export type DraftStore = {
    get: () => string;
    set: (next: string) => void;
    subscribe: (listener: () => void) => () => void;
};

export function createDraftStore(initial = ""): DraftStore {
    let text = initial;
    const listeners = new Set<() => void>();

    return {
        get: () => text,
        set: (next) => {
            if (next === text) return;
            text = next;
            listeners.forEach((listener) => listener());
        },
        subscribe: (listener) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}