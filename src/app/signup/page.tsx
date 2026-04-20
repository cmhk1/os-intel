"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setMessage("Check your email to confirm. Or sign in if confirmations are off.");
    }
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

        <h1 className="font-display text-4xl mb-2">Request access</h1>
        <p className="text-ink-300 text-sm mb-8">Open your trading terminal.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-ink-300 mb-2">
              Full name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-ink-700 border border-ink-500 px-3 py-2.5 text-sm focus:border-amber focus:outline-none transition"
            />
          </div>
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
              minLength={6}
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
          {message && (
            <div className="text-amber text-sm bg-amber-dim/20 border border-amber-dim/40 px-3 py-2">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber text-ink-900 py-2.5 font-medium hover:bg-amber-bright transition disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-ink-300 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-amber hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
