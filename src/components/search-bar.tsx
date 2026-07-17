"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/browse?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search the catalog…"
        aria-label="Search content"
        className="w-full rounded-sm border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-brass outline-none"
      />
    </form>
  );
}
