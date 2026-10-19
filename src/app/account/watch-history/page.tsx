import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContentCard } from "@/components/content-card";
import { CARD_SELECT } from "@/lib/content";

export default async function WatchHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/watch-history");

const watches = await prisma.watchEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
    take: 60,
    include: { content: { select: CARD_SELECT } },
  });

return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl">Watch history</h1>

{watches.length === 0 ? (
        <p className="mt-8 text-text-muted">
          Nothing watched yet. Open any content page while logged in and it shows up here.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {watches.map((w) => (
            <ContentCard key={w.id} content={w.content} />
          ))}
        </div>
      )}
    </div>
  );
}
