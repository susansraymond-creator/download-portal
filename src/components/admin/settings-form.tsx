"use client";

import { useState } from "react";

type Settings = {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  googleAnalyticsId: string;
  googleSiteVerification: string;
  googleAdsensePublisherId: string;
  adsenseEnabled: boolean;
};

export function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(true);

  function unlock() {
    if (!confirm("Unlock settings for editing? Changes affect the entire website.")) return;
    setLocked(false);
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Save these site-wide settings? This will affect the entire website immediately.")) {
      return;
    }
    setLoading(true);
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSaved(true);
      setLocked(true);
    }
  }

  return (
    <form onSubmit={onSubmit} className="index-card max-w-lg space-y-4 p-6">
      <div className="flex items-center justify-between rounded-sm border border-border bg-surface/50 p-3">
        <p className="text-xs text-text-muted">
          {locked ? "🔒 Settings are locked. Unlock to make changes." : "🔓 Settings unlocked — editable."}
        </p>
        {locked && (
          <button
            type="button"
            onClick={unlock}
            className="rounded-sm border border-brass px-3 py-1 text-xs text-brass hover:bg-brass hover:text-ink"
          >
            Unlock
          </button>
        )}
      </div>
      <Field
        label="Site description"
        value={form.siteDescription}
        onChange={(v) => setForm({ ...form, siteDescription: v })}
        textarea
        disabled={locked}
      />
      <Field
        label="Contact email"
        value={form.contactEmail}
        onChange={(v) => setForm({ ...form, contactEmail: v })}
        disabled={locked}
      />
      <Field
        label="Google Analytics ID"
        value={form.googleAnalyticsId}
        onChange={(v) => setForm({ ...form, googleAnalyticsId: v })}
        disabled={locked}
      />
      <Field
        label="Google Search Console verification code"
        value={form.googleSiteVerification}
        onChange={(v) => setForm({ ...form, googleSiteVerification: v })}
        disabled={locked}
      />
      <Field
        label="Google AdSense Publisher ID (e.g. ca-pub-xxxxxxxxxxxxxxxx)"
        value={form.googleAdsensePublisherId}
        onChange={(v) => setForm({ ...form, googleAdsensePublisherId: v })}
        disabled={locked}
      />
      <label className="flex items-center gap-2 text-sm text-text-muted">
        <input
          type="checkbox"
          checked={form.adsenseEnabled}
          disabled={locked}
          onChange={(e) => setForm({ ...form, adsenseEnabled: e.target.checked })}
        />
        Enable AdSense ads on the site
      </label>
      <button
        type="submit"
        disabled={loading || locked}
        className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save settings"}
      </button>
      {saved && <p className="text-sm text-teal">Saved and locked.</p>}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-mono uppercase text-text-muted">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50"
        />
      ) : (
        <input
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50"
        />
      )}
    </div>
  );
}
