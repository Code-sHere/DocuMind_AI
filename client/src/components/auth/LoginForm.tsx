
"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import {
  Sparkles,
  FileText,
  BrainCircuit,
  ShieldCheck,
  BookOpen,
  ArrowUpRight,
  MessageSquareText,
  CheckCircle2,
  Search,
} from "lucide-react";

const LoginForm = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">

      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.6px,transparent_0.6px)] [background-size:24px_24px] opacity-[0.06]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-2">

        {/* LEFT: LOGIN */}
        <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10 lg:px-16">

          <div className="w-full max-w-[460px]">

            {/* Logo */}
            <Link href="/" className="mb-10 inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <BrainCircuit size={24} />
              </div>

              <div>
                <p className="font-display text-xl font-bold tracking-tight">
                  DocuMind <span className="text-primary">AI</span>
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Intelligent workspace
                </p>
              </div>
            </Link>

            {/* Heading */}
            <div className="mb-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Sparkles size={13} />
                Your knowledge awaits
              </div>

              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome
                <span className="text-primary"> back.</span>
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Pick up where you left off. Your documents, conversations
                and insights are waiting for you.
              </p>
            </div>

            {/* Login Card */}
            <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-2xl shadow-black/5 backdrop-blur-2xl sm:p-7">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Sign in to your account
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Continue your research journey.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ArrowUpRight size={20} />
                </div>
              </div>

              <SignIn
                routing="hash"
                signUpUrl="/register"
                forceRedirectUrl="/dashboard"
                appearance={{
                  variables: {
                    colorPrimary: "hsl(var(--primary))",
                    colorBackground: "hsl(var(--card))",
                    colorNeutral: "hsl(var(--foreground))",
                    borderRadius: "0.85rem",
                  },

                  elements: {
                    rootBox: "w-full",
                    card: "w-full max-w-full bg-transparent shadow-none border-0 p-0",
                    header: "hidden",
                    main: "w-full",
                    form: "gap-4",
                    formFieldLabel:
                      "text-foreground text-sm font-medium",
                    formFieldInput:
                      "h-11 rounded-xl border border-border bg-background text-foreground shadow-none focus:border-primary",
                    formButtonPrimary:
                      "h-11 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90",
                    socialButtonsBlockButton:
                      "h-11 rounded-xl border border-border bg-background text-foreground hover:bg-muted",
                    socialButtonsBlockButtonText:
                      "text-foreground font-medium",
                    dividerLine: "bg-border",
                    dividerText: "text-muted-foreground",
                    footer: "bg-transparent",
                    footerActionLink:
                      "text-primary font-semibold hover:opacity-80",
                    footerActionText: "text-muted-foreground",
                    formFieldAction: "text-primary",
                    identityPreview:
                      "bg-muted border-border",
                    identityPreviewText: "text-foreground",
                    identityPreviewEditButton: "text-primary",
                    formFieldErrorText: "text-destructive",
                    alert: "rounded-xl",
                  },
                }}
              />

              <div className="mt-5 flex items-center justify-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground">
                <ShieldCheck size={15} className="text-primary" />
                Secure access to your personal workspace.
              </div>
            </div>

            {/* Register link */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to DocuMind AI?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>

            <p className="mt-10 text-center text-[11px] text-muted-foreground/70">
              © {new Date().getFullYear()} DocuMind AI. All rights reserved.
            </p>
          </div>
        </section>

        {/* RIGHT: WORKSPACE SHOWCASE */}
        <section className="relative hidden items-center justify-center overflow-hidden border-l border-border/50 px-10 py-16 lg:flex xl:px-16">

          <div className="relative w-full max-w-[570px]">

            {/* Intro */}
            <div className="mb-12">
              <div className="mb-5 flex items-center gap-2 text-sm font-medium text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Welcome back to your workspace
              </div>

              <h2 className="font-display text-5xl font-bold leading-[1.12] tracking-tight xl:text-6xl">
                Your knowledge.
                <br />
                Your research.
                <br />
                <span className="text-primary">
                  All connected.
                </span>
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
                Continue exploring your documents, ask smarter questions
                and find the answers that matter.
              </p>
            </div>

            {/* Workspace preview */}
            <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-2xl shadow-black/10 backdrop-blur-2xl">

              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen size={21} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Your workspace
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Everything in one place
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary">
                  READY
                </span>
              </div>

              {/* Document items */}
              <div className="space-y-3">

                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">
                      Research Document.pdf
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      PDF · Document
                    </p>
                  </div>

                  <CheckCircle2 size={17} className="text-primary" />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">
                      Project Documentation.pdf
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      PDF · Document
                    </p>
                  </div>

                  <CheckCircle2 size={17} className="text-primary" />
                </div>
              </div>

              {/* AI Chat Preview */}
              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary">
                  <BrainCircuit size={15} />
                  Ask your documents
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-3">
                  <Search size={15} className="text-muted-foreground" />
                  <span className="flex-1 text-xs text-muted-foreground">
                    What are the key findings?
                  </span>
                  <MessageSquareText size={15} className="text-primary" />
                </div>

                <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                  Get contextual AI answers with references to your original
                  documents.
                </p>
              </div>
            </div>

            {/* Feature cards */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                {
                  icon: FileText,
                  title: "Multi-doc",
                  desc: "One workspace",
                },
                {
                  icon: BrainCircuit,
                  title: "Smart RAG",
                  desc: "Contextual AI",
                },
                {
                  icon: ShieldCheck,
                  title: "Citations",
                  desc: "Verified answers",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-card/50 p-3 backdrop-blur-xl"
                >
                  <item.icon size={19} className="mb-3 text-primary" />
                  <p className="text-xs font-semibold">{item.title}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Think smarter. Research faster. Stay connected to your sources.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginForm;
