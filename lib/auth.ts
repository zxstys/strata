import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "../schema";
import { admin, username } from "better-auth/plugins";

export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [admin(), username()]
});