
"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

const RegisterForm = () => {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center gap-12 overflow-hidden px-6 py-5 text-foreground lg:justify-between lg:px-16">

      {/* Register Card */}
      <section className="glass relative z-10 mx-auto w-full max-w-[560px] shrink-0 rounded-2xl p-6 sm:p-8">

        <Link
          href="/"
          className="font-display text-2xl font-bold tracking-tight"
        >
          DocuMind <span className="text-primary">AI</span>
        </Link>

        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
          Create your desk
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Already registered?{" "}
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Log in
          </Link>
        </p>

        {/* Clerk Sign Up */}
        <div className="mt-4 w-full">
          <SignUp
            routing="hash"
            signInUrl="/login"
            forceRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: "hsl(var(--primary))",
                colorBackground: "hsl(var(--card))",
                colorText: "hsl(var(--foreground))",
                colorTextSecondary: "hsl(var(--muted-foreground))",
                colorInputBackground: "hsl(var(--muted))",
                colorInputText: "hsl(var(--foreground))",
                colorNeutral: "hsl(var(--foreground))",
                borderRadius: "0.75rem",
              },

              elements: {
                rootBox: "w-full",
                card: "w-full max-w-full bg-transparent shadow-none border-0 p-0",
                header: "hidden",
                main: "w-full",
                form: "gap-3",
                formFieldLabel: "text-foreground text-sm font-medium",
                formFieldInput:
                  "h-11 rounded-xl border border-input bg-muted text-foreground",
                formButtonPrimary:
                  "h-11 rounded-xl bg-primary text-primary-foreground hover:opacity-90",
                socialButtonsBlockButton:
                  "h-11 rounded-xl border border-border bg-background text-foreground hover:bg-muted",
                socialButtonsBlockButtonText: "text-foreground",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground",
                footer: "bg-transparent",
                footerActionLink: "text-primary hover:opacity-80",
                footerActionText: "text-muted-foreground",
                formFieldAction: "text-primary",
                identityPreview: "bg-muted border-border",
                identityPreviewText: "text-foreground",
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

export default RegisterForm;
