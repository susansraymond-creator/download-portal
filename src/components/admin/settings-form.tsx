"use client";

import { useState } from "react";

type Settings = {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  googleAnalyticsId: string;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="index-card max-w-lg space-y-4 p-6">
      <Field
        label="Site name"
        value={form.siteName}
        onChange={(v) => setForm({ ...form, siteName: v })}
      />
      <Field
        label="Site description"
        value={form.siteDescription}
        onChange={(v) => setForm({ ...form, siteDescription: v })}
        textarea
      />
      <Field
        label="Contact email"
        value={form.contactEmail}
        onChange={(v) => setForm({ ...form, contactEmail: v })}
      />
      <Field
        label="Google Analytics ID"
        value={form.googleAnalyticsId}
        onChange={(v) => setForm({ ...form, googleAnalyticsId: v })}
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save settings"}
      </button>
      {saved && <p className="text-sm text-teal">Saved.</p>}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-mono uppercase text-text-muted">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
