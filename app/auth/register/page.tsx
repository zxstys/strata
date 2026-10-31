"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Field from "@/components/Field";
import { authClient } from "@/lib/auth-client";

export default function Register() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    async function handleRegister(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        const form = new FormData(e.currentTarget);
        const name = form.get("name") as string;
        const email = form.get("email") as string;
        const password = form.get("password") as string;
        const confirmPassword = form.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await authClient.signUp.email({
                name,
                email,
                password,
                username: name,
                callbackURL: "/",
            });

            if (error) {
                setError(error.message || "Unable to create your account.");
                return;
            }

            window.location.assign("/");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const passwordType = showPassword ? "text" : "password";

    return (
        <div className="flex min-h-screen flex-col">
            <Nav session={null} />

            <main className="flex flex-1 items-center justify-center px-4 pb-16">
                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Get started with Strata in a few seconds.
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <Field
                            id="name"
                            name="name"
                            label="Name"
                            placeholder="John Doe"
                            autoComplete="name"
                            required
                        />
                        <Field
                            id="email"
                            name="email"
                            type="email"
                            label="Email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                        <Field
                            id="password"
                            name="password"
                            type={passwordType}
                            label="Password"
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                        <Field
                            id="confirmPassword"
                            name="confirmPassword"
                            type={passwordType}
                            label="Confirm password"
                            placeholder="Repeat your password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />

                        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                                className="size-4 accent-primary"
                            />
                            Show passwords
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
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="font-medium text-foreground hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}