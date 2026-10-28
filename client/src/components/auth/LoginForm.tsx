
import React from "react";
import Link from "next/link";

const RegisterForm = () => {
  return (
    <main className="relative flex min-h-screen items-center justify-between gap-12 overflow-hidden px-7 py-10 text-foreground md:px-16">
      {/* Authentication card */}
      <section className="glass relative z-10 w-full max-w-[520px] shrink-0 p-7 sm:p-11">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight"
        >
          DocuMind <span className="text-primary">AI</span>
        </Link>

        <h1 className="mt-7 text-3xl font-bold tracking-tight sm:text-4xl">
          Create your desk
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Register
          </Link>
        </p>

        <form className="mt-6 space-y-3">

          <input
            name="email"
            type="email"
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            required
            className="h-[46px] w-full rounded-xl border border-input bg-muted px-3 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-[46px] w-full rounded-xl border border-input bg-muted px-3 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
          />

          {/* Password strength decoration */}
          <div className="flex gap-2 pt-0.5" aria-hidden="true">
            <div className="h-[5px] flex-1 rounded-full bg-primary" />
            <div className="h-[5px] flex-1 rounded-full bg-primary" />
            <div className="h-[5px] flex-1 rounded-full bg-border" />
          </div>

          <p className="text-xs text-muted-foreground">
            8+ characters · a number · a symbol
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
