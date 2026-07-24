import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeasonManager } from "@/components/admin/season-manager";

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

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl">Seasons &amp; Episodes</h1>
      <p className="mb-8 text-sm text-text-muted">{content.title}</p>
      <SeasonManager contentId={content.id} initialSeasons={seasons} />
    </div>
  );
}