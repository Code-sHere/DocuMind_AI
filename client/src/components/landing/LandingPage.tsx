import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LandingNav from "@/app/(app)/layout";

const steps = [
  {
    label: "01 · Upload",
    title: "Drop PDF, DOCX or TXT",
    description: "Pages are read, split and indexed while you watch.",
  },
  {
    label: "02 · Ask",
    title: "Chat across documents",
    description: "Pick which files are in scope. Nothing else is searched.",
  },
  {
    label: "03 · Verify",
    title: "Click a citation, see the page",
    description: "The passage is highlighted right on the source page.",
  },
];

export default function LandingPage() {
  return (
    <main>
      <LandingNav/>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col gap-5">
          <span className="tag-chip w-fit">Every answer shows its proof</span>

          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Ask your documents. Get <span className="text-primary">proof</span>, not guesses.
          </h1>

          <p className="max-w-xl text-lg text-muted-foreground">
            Upload a PDF, ask in plain language, and see the exact page and passage behind
            every answer. No proof found? It tells you.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "btn-gradient")}
            >
              Upload your first document
            </Link>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "glass")}
            >
              Watch 40-second demo
            </button>
          </div>
        </div>

        {/* Demo card */}
        <div>
          <div className="glass p-6">
            <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-bubble px-4 py-3 text-sm text-bubble-foreground">
              What is the notice period?
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Sixty days, in writing.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Either party must notify before renewal <span className="citation-chip">1</span>
            </p>
          </div>

          {/* The source page is always "paper", in every theme */}
          <div className="mt-20 w-[85%] -rotate-2 rounded-xl bg-[#F6F0E2] p-5 text-[#14192B] shadow-2xl ml-20">
            <p className="font-mono text-xs opacity-70">contract.pdf · PAGE 7</p>
            <p className="mt-2 text-sm">
              …must provide <mark>sixty (60) days written notice</mark> prior to renewal…
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-24 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.label} className="glass p-6">
            <p className="section-label">{step.label}</p>
            <h3 className="mt-2 font-display text-xl font-bold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}