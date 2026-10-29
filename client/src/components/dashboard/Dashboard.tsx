
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMe, logout, type User } from "@/lib/api/auth";
import { toast } from "sonner";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const result = await getMe();

        if (active) {
          setUser(result.user);
        }
      } catch {
        if (active) {
          router.replace("/login");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      await logout();

      toast.success("Logged out successfully");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to log out"
      );
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">
          Loading your workspace...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight"
          >
            DocuMind <span className="text-primary">AI</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* User identity */}
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold">
                  {user.name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </nav>
      </header>

      {/* Dashboard content */}
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <section className="glass rounded-2xl p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">
            YOUR WORKSPACE
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {user.name.split(" ")[0]}!
          </h1>

          <p className="mt-3 max-w-xl text-muted-foreground">
            Your documents, conversations, and insights
            are ready. Upload a document to start exploring
            your knowledge with AI.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard/upload"
              className="btn-gradient rounded-xl px-5 py-3 text-sm font-semibold"
            >
              Upload document
            </Link>

            <Link
              href="/dashboard/library"
              className="rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              Open library
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
