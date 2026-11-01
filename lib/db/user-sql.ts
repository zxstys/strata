// lib/user-sql.ts
import { user } from "@/schema";
import { sql } from "drizzle-orm";

// True when the account has the moderator role. Used in every author query.
export const isModSql = sql<boolean>`(${user.role} = 'mod')`;