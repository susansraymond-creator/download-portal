import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getContentBySlug, getRelatedContent } from "@/lib/content";
import { prisma } from "@/lib/prisma";
import { ContentCard } from "@/components/content-card";
import { DownloadLinksList } from "@/components/download-links-list";
import { FavoriteButton } from "@/components/favorite-button";
import { ReportButton } from "@/components/report-button";
import { auth } from "@/lib/auth";

export const revalidate = 60;
export const dynamic = 'force-dynamic';

async function loadContent(slug: string) {
  const content = await getContentBySlug(slug);
  return content;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const content = await loadContent(slug);
  if (!content) return {};

  const title = content.metaTitle || content.title;
  const description =
    content.metaDescription || content.shortDescription || content.description.slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical: content.canonicalUrl || `/content/${content.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: content.ogImageUrl || content.posterUrl ? [content.ogImageUrl || content.posterUrl!] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export async function generateStaticParams() {
  const items = await prisma.content.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
    take: 200,
  });
  return items.map((i) => ({ slug: i.slug }));
}

const TYPE_LABELS: Record<string, string> = {
  VIDEO: "Video",
  COURSE: "Course",
  TUTORIAL: "Tutorial",
  DOCUMENT: "Document",
  SOFTWARE: "Software",
  AUDIO: "Audio",
  IMAGE: "Image",
  ARCHIVE: "Archive",
};

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await loadContent(slug);
  if (!content) notFound();

  const [related, session] = await Promise.all([
    getRelatedContent(content.id, content.categoryId, 6),
    auth(),
  ]);

  // Fire-and-forget view increment (don't block render on it).
  prisma.content
    .update({ where: { id: content.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: content.title,
    description: content.shortDescription || content.description.slice(0, 200),
    image: content.posterUrl || content.thumbnailUrl || undefined,
    dateModified: content.updatedAt.toISOString(),
    datePublished: (content.publishedAt ?? content.createdAt).toISOString(),
    genre: content.category?.name,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: "Browse", item: "/browse" },
      ...(content.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: content.category.name,
              item: `/browse?category=${content.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: content.category ? 4 : 3,
        name: content.title,
        item: `/content/${content.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <nav className="mb-6 flex flex-wrap items-center gap-1 font-mono text-xs text-text-muted">
        <Link href="/" className="hover:text-text">Home</Link>
        <span>/</span>
        <Link href="/browse" className="hover:text-text">Browse</Link>
        {content.category && (
          <>
            <span>/</span>
            <Link href={`/browse?category=${content.category.slug}`} className="hover:text-text">
              {content.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-text">{content.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
        <div>
          <div className="index-card relative aspect-[3/4] w-full overflow-hidden">
            {content.posterUrl ? (
              <Image src={content.posterUrl} alt={content.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-mono text-xs text-text-muted">
                NO POSTER
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <FavoriteButton contentId={content.id} isLoggedIn={!!session?.user} />
            <ReportButton contentId={content.id} isLoggedIn={!!session?.user} />
          </div>
        </div>

        <div>
          <p className="stamp text-brass">{TYPE_LABELS[content.type] ?? content.type}</p>
          <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{content.title}</h1>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-text-muted">
            <span>{content.viewCount.toLocaleString()} views</span>
            <span>{content.downloadCount.toLocaleString()} downloads</span>
            {content.author?.name && <span>Added by {content.author.name}</span>}
          </div>

          {content.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {content.tags.map((t) => (
                <Link
                  key={t.id}
                  href={`/browse?tag=${t.slug}`}
                  className="rounded-sm border border-border px-2 py-0.5 font-mono text-[0.65rem] text-text-muted hover:border-brass hover:text-brass"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          )}

          <p className="mt-6 whitespace-pre-line leading-relaxed text-text-muted">
            {content.description}
          </p>

          <div className="mt-8">
            <h2 className="mb-3 font-display text-xl">Download links</h2>
            <DownloadLinksList links={content.downloadLinks} contentSlug={content.slug} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl">Related content</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
