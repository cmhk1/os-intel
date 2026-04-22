"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    await fetch("/api/auth/ensure-org", { method: "POST" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-40" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber/10 rounded-full blur-[120px]" />

      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-ink-300 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-2 h-2 bg-amber rounded-full animate-pulse" />
          <span className="font-mono text-xs tracking-[0.2em] uppercase">OS-INTEL</span>
        </div>

        <h1 className="font-display text-4xl mb-2">Sign in</h1>
        <p className="text-ink-300 text-sm mb-8">Access your terminal.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-ink-300 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink-700 border border-ink-500 px-3 py-2.5 text-sm focus:border-amber focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-ink-300 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink-700 border border-ink-500 px-3 py-2.5 text-sm focus:border-amber focus:outline-none transition"
            />
          </div>

          {error && (
            <div className="text-crimson text-sm bg-crimson-muted/20 border border-crimson-muted/40 px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber text-ink-900 py-2.5 font-medium hover:bg-amber-bright transition disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-ink-300 mt-6">
          No account?{" "}
          <Link href="/signup" className="text-amber hover:underline">
            Request access
          </Link>
        </p>
      </div>
    </main>
  );
}
