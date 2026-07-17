import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContentCard } from "@/components/content-card";
import { CARD_SELECT } from "@/lib/content";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/favorites");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { content: { select: CARD_SELECT } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl">Your favorites</h1>

      {favorites.length === 0 ? (
        <p className="mt-8 text-text-muted">You haven&apos;t favorited anything yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => (
            <ContentCard key={f.id} content={f.content} />
          ))}
        </div>
      )}
    </div>
  );
}
