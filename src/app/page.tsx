import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ContentCard } from "@/components/content-card";
import { Pagination } from "@/components/pagination";
import { FilterGrid } from "@/components/filter-grid";
import {
  getFeaturedContent,
  getHomeFeedPage,
  getCategories,
  getDistinctLanguages,
} from "@/lib/content";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [siteNameSetting, descSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "siteName" } }).catch(() => null),
    prisma.setting.findUnique({ where: { key: "siteDescription" } }).catch(() => null),
  ]);
  const siteName = (siteNameSetting?.value as string) || "The Stacks";
  const siteDescription =
    (descSetting?.value as string) ||
    "A curated download catalog for personally owned and licensed digital content. Browse by category, see what's new, and find what's popular.";

return {
    title: `${siteName} — A personal, well-kept archive`,
    description: siteDescription,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

const [{ items: feed, pages: totalPages }, categories, languages, featured] = await Promise.all([
    getHomeFeedPage(page, 30),
    getCategories(),
    getDistinctLanguages(),
    getFeaturedContent(5),
  ]);

return (
    <div>

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

{/* Pinned picks hero */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <h2 className="mb-6 font-display text-2xl font-bold uppercase tracking-wide text-brass">
            ?? Pinned picks
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {featured.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        </section>
      )}

{feed.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-6 text-center">
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-teal">
              Recently Updated
            </h2>
            <p className="mt-1 font-mono text-xs text-text-muted">
              ?? New day, new movie ??
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {feed.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
        </section>
      )}

<section className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6">
        {languages.length > 0 && (
          <FilterGrid
            title="Languages"
            items={languages.map((l) => ({ name: l, slug: l }))}
            paramName="language"
            color="brass"
          />
        )}
        {categories.length > 0 && (
          <FilterGrid
            title="Genres"
            items={categories.map((c) => ({ name: c.name, slug: c.slug }))}
            paramName="category"
            color="teal"
          />
        )}
      </section>
    </div>
  );
}
