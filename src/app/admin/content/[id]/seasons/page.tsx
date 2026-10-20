import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeasonManager } from "@/components/admin/season-manager";

type LabelRow = { id: string; episodeNumberLabel: string | null };

export default async function ContentSeasonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const content = await prisma.content.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!content) notFound();

  const seasons = await prisma.season.findMany({
    where: { contentId: id },
    orderBy: { seasonNumber: "asc" },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
        include: { downloadLinks: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  // episodeNumberLabel is read via raw SQL until the Prisma client is
  // regenerated with the new optional field.
  const labels = await prisma.$queryRaw<LabelRow[]>`
    SELECT "id", "episodeNumberLabel" FROM "Episode"
    WHERE "seasonId" IN (SELECT "id" FROM "Season" WHERE "contentId" = ${id})
  `;
  const labelMap = new Map(labels.map((row) => [row.id, row.episodeNumberLabel]));

  const labelled = seasons.map((season) => ({
    ...season,
    episodes: season.episodes.map((episode) => ({
      ...episode,
      episodeNumberLabel: labelMap.get(episode.id) ?? null,
    })),
  }));

  return (
    <div>
      <nav className="mb-8 flex flex-wrap items-center gap-1 font-mono text-xs text-text-muted">
        <Link href="/admin/content" className="hover:text-text">Content</Link>
        <span>/</span>
        <span className="text-text">{content.title}</span>
        <span>/</span>
        <span className="text-brass">Seasons &amp; Episodes</span>
      </nav>
      <h1 className="font-display text-3xl">{content.title}</h1>
      <p className="mt-2 mb-8 text-sm text-text-muted">
        Manage seasons, episode ranges, players, and download links.
      </p>
      <SeasonManager contentId={content.id} initialSeasons={labelled} />
    </div>
  );
}
