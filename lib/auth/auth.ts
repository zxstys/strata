import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db";
import * as schema from "../../schema";
import { admin, username } from "better-auth/plugins";

// Your production domain.
const PRODUCTION_ORIGIN = "https://strata.luncs.my.id";

// Vercel preview deployments for this project.
const VERCEL_PREVIEW = /^https:\/\/strata-[a-z0-9-]+-zxstys\.vercel\.app$/;

const baseURL = process.env.BETTER_AUTH_URL ?? PRODUCTION_ORIGIN;

export const auth = betterAuth({
    baseURL,
    trustedOrigins: async (request) => {
        const origin = request?.headers.get("origin") ?? "";

        return [
            "http://localhost:3000",
            PRODUCTION_ORIGIN,
            process.env.BETTER_AUTH_URL ?? "",
            VERCEL_PREVIEW.test(origin) ? origin : "",
        ].filter(Boolean);
    },
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [admin(), username()],
});