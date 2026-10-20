import { prisma } from "@/lib/prisma";

export async function GET() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://koreandramalink.vercel.app";

  const now = new Date();

  // Only include content that is visible on the public site right now, and
  // use the configured site name from settings instead of a hardcoded brand.
  const [items, siteNameSetting] = await Promise.all([
    prisma.content.findMany({
      where: {
        status: "PUBLISHED",
        AND: [
          { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
          { OR: [{ categoryId: null }, { category: { isHidden: false } }] },
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        title: true,
        slug: true,
        shortDescription: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    prisma.setting.findUnique({ where: { key: "siteName" } }).catch(() => null),
  ]);
  const siteName = (siteNameSetting?.value as string) || "The Stacks";

  const xmlItems = items
    .map(
      (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${siteUrl}/content/${item.slug}</link>
      <guid>${siteUrl}/content/${item.slug}</guid>
      <pubDate>${(item.publishedAt ?? item.createdAt).toUTCString()}</pubDate>
      ${item.shortDescription ? `<description>${escapeXml(item.shortDescription)}</description>` : ""}
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteName)} - Recently added</title>
    <link>${siteUrl}</link>
    <description>Recently added content on ${escapeXml(siteName)}</description>
    ${xmlItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
