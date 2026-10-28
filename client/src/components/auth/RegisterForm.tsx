
"use client";

import React, { useState } from "react";
import Link from "next/link";

const RegisterForm = () => {
  const [password, setPassword] = useState("");

  const hasMinLength = password.length >= 8;
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
    password.length === 0
      ? ""
      : score <= 1
        ? "Weak"
        : score <= 2
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

  return (
    <main className="relative flex min-h-screen items-center justify-between gap-12 overflow-hidden px-7 py-10 text-foreground md:px-16">
      {/* Register card */}
      <section className="glass relative z-10 w-full max-w-[520px] shrink-0 p-7 sm:p-11">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          DocuMind <span className="text-primary">AI</span>
        </Link>

        <h1 className="mt-7 text-3xl font-bold tracking-tight sm:text-4xl">
          Create your desk
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Log in
          </Link>
        </p>

        <form className="mt-6 space-y-3">
          <input
            name="name"
            type="text"
            placeholder="Full name"
            aria-label="Full name"
            autoComplete="name"
            required
            className="h-[46px] w-full rounded-xl border border-input bg-muted px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            required
            className="h-[46px] w-full rounded-xl border border-input bg-muted px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            className="h-[46px] w-full rounded-xl border border-input bg-muted px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
          />

          {/* Dynamic password strength bars */}
          <div
            className="flex gap-2 pt-0.5"
            role="progressbar"
            aria-label="Password strength"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={score}
          >
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`h-[5px] flex-1 rounded-full transition-colors duration-300 ${
                  score >= bar ? strengthColor : "bg-border"
                }`}
              />
            ))}
          </div>

          {/* Dynamic strength label */}
          <p
            aria-live="polite"
            className={`text-xs ${
              score <= 1
                ? "text-destructive"
                : score === 2
                  ? "text-warning"
                  : "text-success"
            }`}
          >
            {password.length === 0
              ? "8+ characters · a number · a symbol"
              : `${strength} password · ${
                  hasMinLength ? "8+ characters ✓" : "Need 8+ characters"
                } · ${hasNumber ? "number ✓" : "add a number"} · ${
                  hasSymbol ? "symbol ✓" : "add a symbol"
                }`}
          </p>

          <button
            type="submit"
            className="btn-gradient mt-1 h-11 w-full rounded-xl transition hover:brightness-110"
          >
            Create account
          </button>
        </form>
      </section>

      {/* Right-side headline */}
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
