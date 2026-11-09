
"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import {
  Sparkles,
  FileText,
  BrainCircuit,
  ShieldCheck,
  BookOpen,
  ArrowUpRight,
  Quote,
  CheckCircle2,
} from "lucide-react";

const RegisterForm = () => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">

      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_0.6px,transparent_0.6px)] [background-size:24px_24px] opacity-[0.06]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-1 lg:grid-cols-2">

        {/* LEFT: AUTHENTICATION */}
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
                Start your AI journey
              </div>

              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Create your
                <span className="text-primary"> workspace.</span>
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Bring your documents together. Ask questions, discover insights
                and get answers backed by real sources.
              </p>
            </div>

            {/* Register Card */}
            <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-2xl shadow-black/5 backdrop-blur-2xl sm:p-7">

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Create an account
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    It only takes a few moments.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ArrowUpRight size={20} />
                </div>
              </div>

              <SignUp
                routing="hash"
                signInUrl="/login"
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
                Your documents and workspace stay protected.
              </div>
            </div>

            {/* Login */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-10 text-center text-[11px] text-muted-foreground/70">
              © {new Date().getFullYear()} DocuMind AI. All rights reserved.
            </p>
          </div>
        </section>

        {/* RIGHT: PRODUCT SHOWCASE */}
        <section className="relative hidden items-center justify-center overflow-hidden border-l border-border/50 px-10 py-16 lg:flex xl:px-16">

          <div className="relative w-full max-w-[570px]">

            {/* Intro */}
            <div className="mb-12">
              <div className="mb-5 flex items-center gap-2 text-sm font-medium text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Your documents. A smarter way to think.
              </div>

              <h2 className="font-display text-5xl font-bold leading-[1.12] tracking-tight xl:text-6xl">
                Knowledge is
                <br />
                powerful.
                <br />
                <span className="text-primary">
                  Make it useful.
                </span>
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
                Upload multiple documents, chat with your knowledge base
                and verify every AI answer with contextual citations.
              </p>
            </div>

            {/* Document Preview */}
            <div className="relative rounded-3xl border border-border/70 bg-card/70 p-5 shadow-2xl shadow-black/10 backdrop-blur-2xl">

              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText size={21} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Research Document.pdf
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Document analysis
                    </p>
                  </div>
                </div>

                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary">
                  ANALYZED
                </span>
              </div>

              <div className="space-y-2 rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-primary">
                  <Sparkles size={14} />
                  AI Generated Answer
                </div>

                <p className="text-sm leading-6 text-foreground/90">
                  Based on your uploaded research, the key findings suggest
                  that intelligent retrieval improves the accuracy and
                  relevance of document-based answers.
                </p>

                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
                    <Quote size={14} />
                    Source citation
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Research Document.pdf · Page 12 · Paragraph 3
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-primary">
                    <CheckCircle2 size={13} />
                    Verified source
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen size={17} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold">
                    Source-grounded answers
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Every answer connected to your documents.
                  </p>
                </div>
                <CheckCircle2 size={17} className="text-primary" />
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

export default RegisterForm;
