
"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

const LoginForm = () => {
  return (
    <main className="relative flex min-h-screen items-center justify-between gap-12 overflow-hidden px-7 py-10 text-foreground md:px-16">
      {/* Login Card */}
      <section className="glass relative z-10 w-full max-w-[520px] shrink-0 p-7 sm:p-11">
        <Link
          href="/"
          className="font-display text-2xl font-bold tracking-tight"
        >
          DocuMind <span className="text-primary">AI</span>
        </Link>

        <h1 className="mt-7 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back
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

        <div className="mt-6">
          <SignIn
            routing="hash"
            signUpUrl="/register"
            forceRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full bg-transparent shadow-none p-0",
                header: "hidden",
                socialButtonsBlockButton:
                  "border border-border bg-background text-foreground hover:bg-muted",
                formFieldLabel: "text-foreground",
                formFieldInput:
                  "h-[46px] rounded-xl border border-input bg-muted text-foreground",
                formButtonPrimary:
                  "h-11 rounded-xl btn-gradient hover:brightness-110",
                footerActionLink:
                  "text-primary hover:text-primary/80",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground",
                identityPreviewEditButton: "text-primary",
              },
            }}
          />
        </div>
      </section>

      {/* Right Side */}
      <section className="relative z-10 hidden flex-1 items-center justify-center lg:flex">
        <h2 className="max-w-2xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight xl:text-6xl">
          Every answer, traced
          <br />
          to its <span className="text-primary">page</span>.
        </h2>
      </section>
    </main>
  );
};

export default LoginForm;
