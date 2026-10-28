
import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LandingNav = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-16">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          DocuMind <span className="text-primary">AI</span>
        </Link>

        {/* Navigation buttons */}
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "glass"
            )}
          >
            Log in
          </Link>

          <Link
            href="/register"
            className={cn(
              buttonVariants(),
              "btn-gradient"
            )}
          >
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default LandingNav;
