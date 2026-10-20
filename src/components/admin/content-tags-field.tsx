"use client";

import { useState } from "react";

export type ContentTagOption = { id: string; name: string };

export function ContentTagsField({
  contentId,
  tags,
  initialTagIds,
}: {
  contentId: string;
  tags: ContentTagOption[];
  initialTagIds: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initialTagIds);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]
    );
    setMessage("");
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: selected }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to save tags");
      setMessage("Tags saved as a pending change. Accept it from Updates.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save tags");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="index-card space-y-4 p-6">
      <h2 className="font-display text-lg">Tags</h2>
      {tags.length === 0 ? (
        <p className="text-sm text-text-muted">Create tags first from Admin → Tags.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = selected.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={`rounded-sm border px-3 py-1.5 text-xs transition-colors ${
                  active ? "border-teal bg-teal text-ink" : "border-border text-text-muted hover:text-text"
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-sm border border-teal px-4 py-2 text-sm text-teal hover:bg-teal hover:text-ink disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save tags"}
        </button>
        {message && <p className="text-xs text-text-muted">{message}</p>}
      </div>
    </section>
  );
}
