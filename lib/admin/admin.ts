// lib/admin.ts
import { auth } from "@/lib/auth/auth";
import { isAdmin, isStaff } from "@/lib/user/roles";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function sessionUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
}

// Admins only: stats, user management, role changes.
export async function getAdminSession() {
    const u = await sessionUser();
    return u && isAdmin(u.role) ? u : null;
}

// Admins and moderators: posts, support queue.
export async function getStaffSession() {
    const u = await sessionUser();
    return u && isStaff(u.role) ? u : null;
}

export const forbidden = () =>
    NextResponse.json({ message: "Forbidden" }, { status: 403 });