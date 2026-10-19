"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SearchResult = {
  id: string;
  slug: string;
  title: string;
  category: { name: string } | null;
};

export function SearchBar({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);

return () => clearTimeout(timer);
  }, [value]);

useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/browse?${params.toString()}`);
  }

return (
    <div ref={boxRef} className="relative">
      <form onSubmit={onSubmit}>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search the catalog..."
          aria-label="Search content"
          className="w-full rounded-sm border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-brass outline-none"
        />
      </form>

{open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-sm border border-border bg-surface shadow-lg">
          {results.map((r, i) => (
            <li key={r.id}>
              <Link
                href={`/content/${r.slug}`}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 text-sm ${
                  i === active ? "bg-ink text-text" : "text-text-muted hover:bg-ink hover:text-text"
                }`}
              >
                {r.title}
                {r.category?.name && (
                  <span className="ml-2 font-mono text-xs text-text-muted">
                    {r.category.name}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
