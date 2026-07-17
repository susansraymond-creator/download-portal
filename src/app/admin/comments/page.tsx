import { prisma } from "@/lib/prisma";
import { CommentModerationRow } from "@/components/admin/comment-row";

export default async function AdminCommentsPage() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } }, content: { select: { title: true, slug: true } } },
  });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Comments</h1>
      <div className="space-y-3">
        {comments.map((c) => (
          <CommentModerationRow
            key={c.id}
            comment={{
              id: c.id,
              body: c.body,
              status: c.status,
              author: c.user.name ?? c.user.email,
              contentTitle: c.content.title,
              contentSlug: c.content.slug,
            }}
          />
        ))}
        {comments.length === 0 && <p className="text-text-muted">No comments yet.</p>}
      </div>
    </div>
  );
}
