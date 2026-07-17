"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push("/login");
  }

  if (!token) {
    return (
      <p className="index-card mx-auto max-w-sm p-6 text-sm text-danger">
        Missing or invalid reset link.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="index-card mx-auto max-w-sm space-y-4 p-6">
      <h1 className="font-display text-2xl">Choose a new password</h1>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div>
        <label className="mb-1 block text-xs font-mono uppercase text-text-muted">
          New password
        </label>
        <input
          type="password"
          required
          minLength={8}
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
        {loading ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
