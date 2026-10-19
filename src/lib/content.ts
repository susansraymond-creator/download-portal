import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/redis";
import type { Prisma } from "@prisma/client";

const PUBLISHED_WHERE: Prisma.ContentWhereInput = {
  status: "PUBLISHED",
  AND: [
    { OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }] },
    { OR: [{ categoryId: null }, { category: { isHidden: false } }] },
  ],
};

export const CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  type: true,
  thumbnailUrl: true,
  posterUrl: true,
  isFeatured: true,
  viewCount: true,
  downloadCount: true,
  imdbRating: true,
  primaryQuality: true,
  primaryLanguage: true,
  updateLabel: true,
  seriesStatus: true,
  updatedAt: true,
  publishedAt: true,
  createdAt: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ContentSelect;

export async function getFeaturedContent(limit = 6) {
  return cached(`content:featured:${limit}`, 120, () =>
    prisma.content.findMany({
      where: { ...PUBLISHED_WHERE, isFeatured: true },
      select: CARD_SELECT,
      orderBy: { publishedAt: "desc" },
      take: limit,
    })
  );
}

export async function getRecentContent(limit = 12) {
  return cached(`content:recent:${limit}`, 60, () =>
    prisma.content.findMany({
      where: PUBLISHED_WHERE,
      select: CARD_SELECT,
      orderBy: { publishedAt: "desc" },
      take: limit,
    })
  );
}

export async function getPopularContent(limit = 12) {
  return cached(`content:popular:${limit}`, 300, () =>
    prisma.content.findMany({
      where: PUBLISHED_WHERE,
      select: CARD_SELECT,
      orderBy: [{ viewCount: "desc" }, { downloadCount: "desc" }, { publishedAt: "desc" }],
      take: limit,
    })
  );
}

export async function getHomeFeed(limit = 60) {
  return cached(`content:homefeed:${limit}`, 60, () =>
    prisma.content.findMany({
      where: PUBLISHED_WHERE,
      select: CARD_SELECT,
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      take: limit,
    })
  );
}

export async function getHomeFeedPage(page: number, perPage = 30) {
  const [items, total] = await Promise.all([
    prisma.content.findMany({
      where: PUBLISHED_WHERE,
      select: CARD_SELECT,
      orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.content.count({ where: PUBLISHED_WHERE }),
  ]);
  return { items, total, pages: Math.ceil(total / perPage) };
}

export async function getDistinctLanguages() {
  return cached("content:languages", 3600, async () => {
    const rows = await prisma.content.findMany({
      where: { ...PUBLISHED_WHERE, primaryLanguage: { not: null } },
      select: { primaryLanguage: true },
      distinct: ["primaryLanguage"],
    });
    const names = new Set<string>();
    for (const r of rows) {
      for (const part of (r.primaryLanguage ?? "").split(",")) {
        const name = part.trim();
        if (name) names.add(name);
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  });
}

export async function getDistinctQualities() {
  return cached("content:qualities", 3600, async () => {
    const rows = await prisma.content.findMany({
      where: { ...PUBLISHED_WHERE, primaryQuality: { not: null } },
      select: { primaryQuality: true },
      distinct: ["primaryQuality"],
    });
    const names = new Set<string>();
    for (const r of rows) {
      const name = (r.primaryQuality ?? "").trim();
      if (name) names.add(name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  });
}

export async function getCategories() {
  return cached("categories:all", 600, () =>
    prisma.category.findMany({
      where: { isHidden: false },
      orderBy: { name: "asc" },
      include: { _count: { select: { content: true } } },
    })
  );
}

export interface BrowseParams {
  q?: string;
  category?: string;
  type?: string;
  tag?: string;
  language?: string;
  quality?: string;
  sort: "newest" | "popular" | "downloads" | "title";
  page: number;
  perPage: number;
}

export async function browseContent(params: BrowseParams) {
  const where: Prisma.ContentWhereInput = { ...PUBLISHED_WHERE };

if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { shortDescription: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.category) where.category = { slug: params.category };
  if (params.type) where.type = params.type as Prisma.EnumContentTypeFilter["equals"];
  if (params.tag) where.tags = { some: { slug: params.tag } };
  if (params.language) {
    const lang = params.language;
    where.AND = [
      ...(Array.isArray(PUBLISHED_WHERE.AND) ? PUBLISHED_WHERE.AND : []),
      {
        OR: [
          { primaryLanguage: { equals: lang, mode: "insensitive" } },
          { primaryLanguage: { startsWith: `${lang}, `, mode: "insensitive" } },
          { primaryLanguage: { endsWith: `, ${lang}`, mode: "insensitive" } },
          { primaryLanguage: { contains: `, ${lang}, `, mode: "insensitive" } },
        ],
      },
    ];
  }
  if (params.quality) {
    where.primaryQuality = { equals: params.quality, mode: "insensitive" };
  }

const orderBy: Prisma.ContentOrderByWithRelationInput =
    params.sort === "popular"
      ? { viewCount: "desc" }
      : params.sort === "downloads"
        ? { downloadCount: "desc" }
        : params.sort === "title"
          ? { title: "asc" }
          : { publishedAt: "desc" };

const [items, total] = await Promise.all([
    prisma.content.findMany({
      where,
      select: CARD_SELECT,
      orderBy,
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
    }),
    prisma.content.count({ where }),
  ]);

return { items, total, pages: Math.ceil(total / params.perPage) };
}

export async function getContentBySlug(slug: string) {
  return prisma.content.findFirst({
    where: { slug, ...PUBLISHED_WHERE },
    include: {
      category: true,
      tags: true,
      author: { select: { name: true } },
      downloadLinks: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
      },
      seasons: {
        orderBy: { seasonNumber: "asc" },
        include: {
          episodes: {
            orderBy: { episodeNumber: "asc" },
            include: {
              downloadLinks: {
                where: { status: "ACTIVE" },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      relatedTo: { select: CARD_SELECT, take: 6 },
    },
  });
}

export async function getRelatedContent(contentId: string, categoryId: string | null, limit = 6) {
  return prisma.content.findMany({
    where: {
      ...PUBLISHED_WHERE,
      id: { not: contentId },
      ...(categoryId ? { categoryId } : {}),
    },
    select: CARD_SELECT,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

