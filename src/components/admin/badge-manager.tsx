"use client";

import { useState } from "react";

type Option = { id: string; name: string };

export function BadgeManager({
  initialQualities,
  initialLanguages,
}: {
  initialQualities: Option[];
  initialLanguages: Option[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <BadgeColumn title="Quality badges" kind="QUALITY" initial={initialQualities} />
      <BadgeColumn title="Language badges" kind="LANGUAGE" initial={initialLanguages} />
    </div>
  );
}

function BadgeColumn({
  title,
  kind,
  initial,
}: {
  title: string;
  kind: "QUALITY" | "LANGUAGE";
  initial: Option[];
}) {
  const [options, setOptions] = useState(initial);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState("");

  async function addOption(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, name }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to add.");
      return;
    }
    const data = await res.json();
    setOptions((prev) =>
      prev.some((o) => o.id === data.option.id)
        ? prev
        : [...prev, { id: data.option.id, name: data.option.name }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
    );
    setName("");
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  async function removeOption(id: string) {
    if (!confirm("Delete this option? Content already using it keeps its value.")) return;
    const res = await fetch(`/api/admin/badges/${id}`, { method: "DELETE" });
    if (res.ok) setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <div className="index-card space-y-4 p-6">
      <h2 className="font-display text-lg">{title}</h2>

      <form onSubmit={addOption} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New option name"
          className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className={`rounded-sm px-4 py-2 text-sm font-medium text-ink transition-colors ${
            justAdded ? "bg-teal" : "bg-brass hover:bg-brass-bright"
          }`}
        >
          {justAdded ? "Added ✓" : "Add"}
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <span
            key={o.id}
            className="flex items-center gap-2 rounded-sm border border-border px-2 py-1 font-mono text-xs text-text-muted"
          >
            {o.name}
            <button
              type="button"
              onClick={() => removeOption(o.id)}
              className="text-danger hover:underline"
              title="Delete option"
            >
              ×
            </button>
          </span>
        ))}
        {options.length === 0 && (
          <p className="text-sm text-text-muted">No options yet.</p>
        )}
      </div>
    </div>
  );
}