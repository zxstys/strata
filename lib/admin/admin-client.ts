// lib/admin-client.ts
export async function adminFetch(
    url: string,
    method: "PATCH" | "DELETE",
    body?: unknown
) {
    const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message ?? "Request failed.");
    return data;
}