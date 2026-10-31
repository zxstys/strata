export const fetcher = async <T = unknown>(
    url: string,
    init?: Omit<RequestInit, "body"> & { body?: unknown }
): Promise<T> => {
    const res = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json", ...init?.headers },
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json() as Promise<T>;
};