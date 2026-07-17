import Link from "next/link";
import { ContentCard } from "@/components/content-card";
import {
  getFeaturedContent,
  getRecentContent,
  getPopularContent,
  getCategories,
} from "@/lib/content";

export const revalidate = 60;

export default async function HomePage() {
  const [featured, recent, popular, categories] = await Promise.all([
    getFeaturedContent(6),
    getRecentContent(8),
    getPopularContent(8),
    getCategories(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="stamp text-brass">Catalog No. 001 — Est. {new Date().getFullYear()}</p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
            A personal archive, organized like it matters.
          </h1>
          <p className="mt-4 max-w-xl text-text-muted">
            Every title here is catalogued, tagged, and linked to a direct
            download the site owner controls. No streaming, no uploads from
            strangers — just a well-kept index.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/browse"
              className="rounded-sm bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass-bright transition-colors"
            >
              Browse the catalog
            </Link>
            <Link
              href="/browse?sort=newest"
              className="rounded-sm border border-border px-5 py-2.5 text-sm text-text-muted hover:text-text hover:border-text-muted transition-colors"
            >
              See what's new
            </Link>
          </div>
        </div>
      </section>

      {/* Categories rail */}
      {categories.length > 0 && (
        <section className="border-b border-border bg-surface/30">
          <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 py-4 sm:px-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/browse?category=${c.slug}`}
                className="shrink-0 rounded-sm border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-text-muted hover:border-brass hover:text-brass whitespace-nowrap"
              >
                {c.name} · {c._count.content}
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <Section title="Featured" href="/browse?featured=1" items={featured} />
      )}
      {recent.length > 0 && (
        <Section title="Recently added" href="/browse?sort=newest" items={recent} />
      )}
      {popular.length > 0 && (
        <Section title="Popular downloads" href="/browse?sort=popular" items={popular} />
      )}
    </div>
  );
}

function Section({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: Awaited<ReturnType<typeof getRecentContent>>;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-display text-2xl">{title}</h2>
        <Link href={href} className="text-sm text-brass hover:text-brass-bright">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>
    </section>
  );
}
