"use client";
import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  count: number;
  isHidden: boolean;
  description?: string | null;
  icon?: string | null;
};

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setCategories((prev) => [...prev, { ...data.category, count: 0 }]);
      setName("");
      router.refresh();
    }
  }

async function toggleHidden(id: string, current: boolean) {
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isHidden: !current }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isHidden: !current } : c))
      );
      router.refresh();
    }
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDescription(c.description ?? "");
    setEditIcon(c.icon ?? "");
  }

  const [savedId, setSavedId] = useState<string | null>(null);

  async function saveEdit(id: string) {
    const res = await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: editName,
        description: editDescription || null,
        icon: editIcon || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, name: data.category.name, slug: data.category.slug, description: editDescription, icon: editIcon }
            : c
        )
      );
      setEditingId(null);
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addCategory} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="w-full max-w-xs rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          Add
        </button>
      </form>

      <table className="w-full text-sm">
        <thead className="border-b border-border text-left font-mono text-xs uppercase text-text-muted">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Slug</th>
            <th className="py-2">Content</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <Fragment key={c.id}>
              <tr className="border-b border-border/50">
                <td className="py-2">{c.name}</td>
                <td className="py-2 font-mono text-xs text-text-muted">{c.slug}</td>
                <td className="py-2 text-text-muted">{c.count}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleHidden(c.id, c.isHidden)}
                      className={`rounded-sm border px-2 py-1 font-mono text-xs ${
                        c.isHidden
                          ? "border-border text-text-muted hover:border-brass hover:text-brass"
                          : "border-teal text-teal hover:bg-teal/10"
                      }`}
                    >
                      {c.isHidden ? "Hidden — Show" : "Visible — Hide"}
                    </button>
                    <button
                      onClick={() => (editingId === c.id ? setEditingId(null) : startEdit(c))}
                      className="rounded-sm border border-border px-2 py-1 font-mono text-xs text-text-muted hover:text-text"
                    >
                      {editingId === c.id ? "Cancel" : "Edit"}
                    </button>
                    {savedId === c.id && <span className="text-xs text-teal">Saved ✓</span>}
                  </div>
                </td>
              </tr>
              {editingId === c.id && (
                <tr key={`${c.id}-edit`} className="border-b border-border/50 bg-surface/50">
                  <td colSpan={4} className="py-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-mono uppercase text-text-muted">Name</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded-sm border border-border bg-surface px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-mono uppercase text-text-muted">Icon</label>
                        <input
                          value={editIcon}
                          onChange={(e) => setEditIcon(e.target.value)}
                          placeholder="e.g. film, book"
                          className="rounded-sm border border-border bg-surface px-2 py-1 text-sm"
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="mb-1 block text-xs font-mono uppercase text-text-muted">Description</label>
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full rounded-sm border border-border bg-surface px-2 py-1 text-sm"
                        />
                      </div>
                      <button
                        onClick={() => saveEdit(c.id)}
                        className="rounded-sm bg-brass px-3 py-1.5 text-xs font-medium text-ink hover:bg-brass-bright"
                      >
                        Save
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
