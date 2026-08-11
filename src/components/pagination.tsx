import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const windowSize = 2;

  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      (p >= currentPage - windowSize && p <= currentPage + windowSize)
    ) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="mt-10 flex flex-wrap justify-center gap-2 font-mono text-sm">
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 py-2 text-text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={`${basePath}?page=${p}`}
            className={`rounded-sm px-3.5 py-2 ${
              p === currentPage
                ? "bg-brass text-ink"
                : "border border-border text-text-muted hover:text-text"
            }`}
          >
            {p}
          </Link>
        )
      )}
    </div>
  );
}