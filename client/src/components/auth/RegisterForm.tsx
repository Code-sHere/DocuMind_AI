
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { register } from "@/lib/api/auth";

const RegisterForm = () => {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMinLength = password.length >= 8;
  const hasMaxLength = password.length <= 12;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);

  const score = [
    hasMinLength,
    hasNumber,
    hasSymbol,
    hasLowercase && hasUppercase,
  ].filter(Boolean).length;

  const strength =
    !password
      ? ""
      : score <= 1
        ? "Weak"
        : score === 2
          ? "Medium"
          : score === 3
            ? "Strong"
            : "Very strong";

  const strengthColor =
    score <= 1
      ? "bg-destructive"
      : score === 2
        ? "bg-warning"
        : "bg-success";

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const confirmPassword = String(
      formData.get("confirmPassword") ?? ""
    );

    if (name.length < 2 || name.length > 80) {
      setError("Name must be between 2 and 80 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8 || password.length > 12) {
      setError("Password must contain 8–12 characters.");
      return;
    }

    if (
      !hasNumber ||
      !hasSymbol ||
      !hasLowercase ||
      !hasUppercase
    ) {
      setError(
        "Include uppercase and lowercase letters, a number, and a symbol."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const result = await register(name, email, password);

      toast.success(result.message || "Account created successfully!");

      
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create your account.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-between gap-12 overflow-hidden px-7 py-10 text-foreground md:px-16">
      <section className="glass relative z-10 w-full max-w-[520px] shrink-0 p-7 sm:p-11">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          DocuMind <span className="text-primary">AI</span>
        </Link>

        <h1 className="mt-7 text-3xl font-bold tracking-tight sm:text-4xl">
          Create your desk
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            name="name"
            placeholder="Full name"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            required
            className="h-[46px] w-full rounded-xl border border-input bg-muted px-3 text-sm"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            maxLength={254}
            required
            className="h-[46px] w-full rounded-xl border border-input bg-muted px-3 text-sm"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={12}
            required
            className="h-[46px] w-full rounded-xl border border-input bg-muted px-3 text-sm"
          />

          <div
            className="flex gap-2"
            role="progressbar"
            aria-label="Password strength"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={score}
          >
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`h-[5px] flex-1 rounded-full transition-colors ${
                  score >= bar ? strengthColor : "bg-border"
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground" aria-live="polite">
            {password.length === 0
              ? "8–12 characters · uppercase · lowercase · number · symbol"
              : `${strength} password · ${
                  hasMinLength && hasMaxLength
                    ? "length ✓"
                    : "use 8–12 characters"
                } · ${hasNumber ? "number ✓" : "add a number"} · ${
                  hasSymbol ? "symbol ✓" : "add a symbol"
                }`}
          </p>

          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            required
            className="h-[46px] w-full rounded-xl border border-input bg-muted px-3 text-sm"
          />

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient mt-1 h-11 w-full rounded-xl transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </section>

      <section className="relative z-10 hidden flex-1 items-center justify-center lg:flex">
        <h2 className="max-w-2xl text-5xl font-extrabold leading-[1.02] tracking-tight xl:text-6xl">
          Every answer, traced
          <br />
          to its <span className="text-primary">page</span>.
        </h2>
      </section>
    </main>
  );
};

export default RegisterForm;
