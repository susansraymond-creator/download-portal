"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ContentSearch({ initialQuery }: { initialQuery: string }) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();

useEffect(() => {
    const q = value.trim();
    const params = new URLSearchParams(window.location.search);
    const current = (params.get("q") ?? "").trim();

if (q === current) return;

const timer = setTimeout(() => {
      if (q) params.set("q", q);
      else params.delete("q");
      params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);

return () => clearTimeout(timer);
  }, [value, pathname, router]);

return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search content by title..."
      aria-label="Search content"
      className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brass"
    />
  );
}
