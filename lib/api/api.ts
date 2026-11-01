// lib/api.ts
export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

async function request<T>(url: string, init: RequestInit = {}, json?: unknown): Promise<T> {
    const hasJson = json !== undefined;

    const res = await fetch(url, {
        ...init,
        headers: hasJson
            ? { "Content-Type": "application/json", ...(init.headers as Record<string, string>) }
            : init.headers,
        body: hasJson ? JSON.stringify(json) : init.body,
    });

    const data: unknown = res.status === 204 ? null : await res.json().catch(() => null);

    if (!res.ok) {
        const message =
            (data as { message?: string } | null)?.message ?? `Request failed (${res.status})`;
        throw new ApiError(res.status, message);
    }

    return data as T;
}

export const api = {
    get: <T>(url: string) => request<T>(url),
    post: <T = unknown>(url: string, json?: unknown) =>
        request<T>(url, { method: "POST" }, json),
    patch: <T = unknown>(url: string, json?: unknown) =>
        request<T>(url, { method: "PATCH" }, json),
    del: <T = unknown>(url: string, json?: unknown) =>
        request<T>(url, { method: "DELETE" }, json),
    form: <T = unknown>(url: string, body: FormData) =>
        request<T>(url, { method: "POST", body }),
};

// Used as the global SWR fetcher.
export const swrFetcher = (url: string) => api.get(url);