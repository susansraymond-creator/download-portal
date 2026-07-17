"use client";

import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="index-card mx-auto max-w-sm p-6 text-sm text-text-muted">
        If an account exists for that email, we&apos;ve sent a password reset link.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="index-card mx-auto max-w-sm space-y-4 p-6">
      <h1 className="font-display text-2xl">Reset your password</h1>
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
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-brass px-4 py-2.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
