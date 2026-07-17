"use client";

import { useState } from "react";

export function BackupPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function exportData() {
    setLoading(true);
    const res = await fetch("/api/admin/backup");
    const data = await res.json();
    setLoading(false);

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `catalog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage("");
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const result = await res.json();
      setMessage(res.ok ? `Restored ${result.imported} items.` : result.error || "Restore failed.");
    } catch {
      setMessage("Invalid backup file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="index-card max-w-lg space-y-4 p-6">
      <div>
        <p className="mb-2 text-sm font-medium">Export</p>
        <button
          onClick={exportData}
          disabled={loading}
          className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright disabled:opacity-60"
        >
          {loading ? "Working…" : "Download catalog backup (.json)"}
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Restore</p>
        <input type="file" accept="application/json" onChange={onFileChange} disabled={loading} />
        <p className="mt-1 text-xs text-text-muted">
          Restoring skips items whose slug already exists — it will not
          overwrite existing content.
        </p>
      </div>

      {message && <p className="text-sm text-teal">{message}</p>}
    </div>
  );
}
