"use client"; 
 
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
 
import { login } from "@/lib/api/auth";
 
const inputClass =
  "h-[46px] w-full rounded-xl border border-input bg-muted px-3 text-sm outline-none transition focus:border-ring focus:ring-1 focus:ring-ring";
 
const LoginForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
 
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the browser's default page reload
    setError("");
    setLoading(true);
 
    // Read the values from the inputs using their "name" attributes
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
 
    try {
      const data = await login(email, password); // cookie is set by the server here
      toast.success(`Welcome back, ${data.user.name}`);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in");
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <main className="relative flex min-h-screen items-center justify-between gap-12 overflow-hidden px-7 py-10 text-foreground md:px-16">
      <section className="glass relative z-10 w-full max-w-[520px] shrink-0 p-7 sm:p-11">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">
          DocuMind <span className="text-primary">AI</span>
        </Link>
 
        <h1 className="mt-7 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back
        </h1>
 
        <p className="mt-2 text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Register
          </Link>
        </p>
 
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            aria-label="Email"
            autoComplete="email"
            required
            className={inputClass}
          />
 
          <input
            name="password"
            type="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            required
            className={inputClass}
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
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </section>
 
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
 