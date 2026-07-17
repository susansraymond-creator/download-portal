"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="index-card mx-auto max-w-sm space-y-4 p-6">
      <h1 className="font-display text-2xl">Create an account</h1>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <Field
        label="Email"
        type="email"
        value={form.email}
        onChange={(v) => setForm({ ...form, email: v })}
      />
      <Field
        label="Password"
        type="password"
        value={form.password}
        onChange={(v) => setForm({ ...form, password: v })}
      />
      <Field
        label="Confirm password"
        type="password"
        value={form.confirmPassword}
        onChange={(v) => setForm({ ...form, confirmPassword: v })}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-brass px-4 py-2.5 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Register"}
      </button>

      <p className="text-center text-xs text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-brass hover:text-brass-bright">
          Log in
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-mono uppercase text-text-muted">{label}</label>
      <input
        type={type}
        required
        minLength={type === "password" ? 8 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
      />
    </div>
  );
}
