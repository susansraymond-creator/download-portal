import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  const content = await prisma.content.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    take: 5000,
  });

  const categories = await prisma.category.findMany({ select: { slug: true } });

  return [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/browse`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({
      url: `${siteUrl}/browse?category=${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...content.map((c) => ({
      url: `${siteUrl}/content/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
