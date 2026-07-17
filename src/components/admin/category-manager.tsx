"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; slug: string; count: number };

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
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-b border-border/50">
              <td className="py-2">{c.name}</td>
              <td className="py-2 font-mono text-xs text-text-muted">{c.slug}</td>
              <td className="py-2 text-text-muted">{c.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
