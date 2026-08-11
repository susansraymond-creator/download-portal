"use client";

import { useState } from "react";
import Link from "next/link";

export function FilterGrid({
  title,
  items,
  paramName,
  color,
}: {
  title: string;
  items: { name: string; slug: string }[];
  paramName: "language" | "category";
  color: "brass" | "teal";
}) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const filtered = items.filter((i) => i.name.toLowerCase().includes(query));

  const colorClass = color === "brass" ? "text-brass" : "text-teal";

  return (
    <div className="index-card p-5">
      <h2 className="mb-4 text-center font-mono text-sm font-bold uppercase tracking-widest">
        {title}
      </h2>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Search ${title.toLowerCase()}…`}
        className="mb-4 w-full rounded-sm border border-border bg-surface px-4 py-2.5 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {filtered.map((item) => (
          <Link
            key={item.slug}
            href={`/browse?${paramName}=${encodeURIComponent(item.slug)}`}
            className={`rounded-sm border border-border px-3 py-1.5 text-sm font-medium hover:border-current ${colorClass}`}
          >
            {item.name}
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="w-full text-center text-sm text-text-muted">No matches.</p>
        )}
      </div>
    </div>
  );
}