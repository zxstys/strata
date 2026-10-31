// lib/admin.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function getAdminSession() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || session.user.role !== "admin") return null;
    return session.user;
}

export const forbidden = () =>
    NextResponse.json({ message: "Forbidden" }, { status: 403 });