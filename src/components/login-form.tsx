"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="index-card mx-auto max-w-sm space-y-4 p-6">
      <h1 className="font-display text-2xl">Log in</h1>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <label className="mb-1 block text-xs font-mono uppercase text-text-muted">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-mono uppercase text-text-muted">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-brass px-4 py-2.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Log in"}
      </button>

      <div className="flex justify-between text-xs text-text-muted">
        <Link href="/forgot-password" className="hover:text-text">Forgot password?</Link>
        <Link href="/register" className="hover:text-text">Create an account</Link>
      </div>
    </form>
  );
}
