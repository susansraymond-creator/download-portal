"use client";

import { useState } from "react";

type Tag = { id: string; name: string; slug: string };

export function TagManager({ initialTags }: { initialTags: Tag[] }) {
  const [tags, setTags] = useState(initialTags);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setTags((prev) => [...prev, data.tag]);
      setName("");
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  }

  async function deleteTag(id: string) {
    if (!confirm("Delete this tag? It will be removed from all content.")) return;
    await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addTag} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New tag name"
          className="w-full max-w-xs rounded-sm border border-border bg-surface px-3 py-2 text-sm"
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

      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.id}
            className="flex items-center gap-2 rounded-sm border border-border px-2 py-1 font-mono text-xs text-text-muted"
          >
            #{t.name}
            <button
              onClick={() => deleteTag(t.id)}
              className="text-danger hover:underline"
              title="Delete tag"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
