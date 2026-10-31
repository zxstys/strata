import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "../schema";
import { admin, username } from "better-auth/plugins";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [
        "http://localhost:3000",
        process.env.BETTER_AUTH_URL!,
        // Vercel preview deployments for this project
        "https://strata-*-zxstys.vercel.app",
    ],
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [admin(), username()],
});