import { prisma } from "@/lib/prisma";

/**
 * Creates a "new content" notification for every active, non-banned user
 * (excluding the author). Called when content transitions to PUBLISHED
 * for the first time.
 */
export async function notifyNewContent(content: {
  id: string;
  title: string;
  slug: string;
  authorId: string;
}) {
  const users = await prisma.user.findMany({
    where: {
      isBanned: false,
      isActive: true,
      id: { not: content.authorId },
      role: { in: ["VISITOR", "USER", "PREMIUM", "ADMIN", "SUPER_ADMIN"] },
    },
    select: { id: true },
  });

  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: "NEW_CONTENT" as const,
      title: "New content added",
      message: content.title,
      link: `/content/${content.slug}`,
    })),
  });
}