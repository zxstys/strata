"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { authClient } from "@/lib/auth/auth-client";
import Field from "@/components/Field";

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [remember, setRemember] = useState(false);

    async function handleLogin(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const form = new FormData(e.currentTarget);

        try {
            const { error } = await authClient.signIn.email({
                email: form.get("email") as string,
                password: form.get("password") as string,
                rememberMe: remember,
                callbackURL: "/",
            });

            if (error) {
                setError(error.message || "Invalid email or password.");
                return;
            }

            window.location.assign("/");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Nav session={null} />

            <main className="flex flex-1 items-center justify-center px-4 pb-16">
                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Sign in to continue to Strata.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <Field
                            id="email"
                            name="email"
                            type="email"
                            label="Email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="size-4 accent-primary"
                            />
                            Remember me
                        </label>

                        {error && (
                            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/auth/register" className="font-medium text-foreground hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}