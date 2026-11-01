// lib/roles.ts
export type Role = "user" | "mod" | "admin";

export const isAdmin = (role?: string | null) => role === "admin";
export const isMod = (role?: string | null) => role === "mod";
export const isStaff = (role?: string | null) => isAdmin(role) || isMod(role);