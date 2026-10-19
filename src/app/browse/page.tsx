import Link from "next/link";
import type { Metadata } from "next";
import { ContentCard } from "@/components/content-card";
import { SearchBar } from "@/components/search-bar";
import {
  browseContent,
  getCategories,
  getDistinctLanguages,
  getDistinctQualities,
} from "@/lib/content";
import { searchQuerySchema } from "@/lib/validations";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const raw = await searchParams;
  const category = typeof raw.category === "string" ? raw.category : undefined;
  const canonical = category
    ? `/browse?category=${encodeURIComponent(category)}`
    : "/browse";

  return {
    title: "Browse the catalog",
    description: "Search and filter the full content catalog.",
    alternates: { canonical },
    robots: { index: false, follow: true },
  };
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = searchQuerySchema.safeParse({
    q: raw.q,
    category: raw.category,
    type: raw.type,
    tag: raw.tag,
    language: raw.language,
    quality: raw.quality,
    sort: raw.sort,
    page: raw.page,
    perPage: raw.perPage,
  });

  const params = parsed.success
    ? parsed.data
    : { sort: "newest" as const, page: 1, perPage: 24 };

  const [{ items, total, pages }, categories, languages, qualities] = await Promise.all([
    browseContent(params),
    getCategories(),
    getDistinctLanguages(),
    getDistinctQualities(),
  ]);

  function buildHref(overrides: Record<string, string | number | undefined>) {
    const qp = new URLSearchParams();
    const merged = { ...params, ...overrides };
    if (merged.q) qp.set("q", String(merged.q));
    if (merged.category) qp.set("category", String(merged.category));
    if (merged.type) qp.set("type", String(merged.type));
    if (merged.tag) qp.set("tag", String(merged.tag));
    if (merged.language) qp.set("language", String(merged.language));
    if (merged.quality) qp.set("quality", String(merged.quality));
    qp.set("sort", String(merged.sort));
    qp.set("page", String(merged.page ?? 1));
    return `/browse?${qp.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl">Browse</h1>
      <p className="mt-1 text-sm text-text-muted">
        {total.toLocaleString()} item{total === 1 ? "" : "s"} in the catalog
      </p>

      <div className="mt-6 mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-sm flex-1">
          <SearchBar initialValue={params.q} />
        </div>

        <div className="flex flex-wrap gap-2 font-mono text-xs">
          {(["newest", "popular", "downloads", "title"] as const).map((s) => (
            <Link
              key={s}
              href={buildHref({ sort: s, page: 1 })}
              className={`rounded-sm border px-3 py-1.5 uppercase tracking-wide ${
                params.sort === s
                  ? "border-brass text-brass"
                  : "border-border text-text-muted hover:text-text"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-muted">
              Category
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href={buildHref({ category: undefined, page: 1 })}
                  className={!params.category ? "text-brass" : "text-text-muted hover:text-text"}
                >
                  All categories
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={buildHref({ category: c.slug, page: 1 })}
                    className={
                      params.category === c.slug
                        ? "text-brass"
                        : "text-text-muted hover:text-text"
                    }
                  >
                    {c.name} ({c._count.content})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {languages.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-muted">
                Language
              </p>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link
                    href={buildHref({ language: undefined, page: 1 })}
                    className={!params.language ? "text-brass" : "text-text-muted hover:text-text"}
                  >
                    All languages
                  </Link>
                </li>
                {languages.map((l) => (
                  <li key={l}>
                    <Link
                      href={buildHref({ language: l, page: 1 })}
                      className={
                        params.language === l
                          ? "text-brass"
                          : "text-text-muted hover:text-text"
                      }
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {qualities.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-muted">
                Quality
              </p>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link
                    href={buildHref({ quality: undefined, page: 1 })}
                    className={!params.quality ? "text-brass" : "text-text-muted hover:text-text"}
                  >
                    All qualities
                  </Link>
                </li>
                {qualities.map((q) => (
                  <li key={q}>
                    <Link
                      href={buildHref({ quality: q, page: 1 })}
                      className={
                        params.quality === q
                          ? "text-brass"
                          : "text-text-muted hover:text-text"
                      }
                    >
                      {q}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <div>
          {items.length === 0 ? (
            <p className="rounded-sm border border-dashed border-border p-12 text-center text-text-muted">
              Nothing matches those filters yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="mt-10 flex justify-center gap-2 font-mono text-xs">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildHref({ page: p })}
                  className={`rounded-sm border px-3 py-1.5 ${
                    p === params.page
                      ? "border-brass text-brass"
                      : "border-border text-text-muted hover:text-text"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
