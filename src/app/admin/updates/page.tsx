import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ContentChangeActions from "@/components/admin/content-change-actions";

export default async function AdminUpdatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

const [pending, recent] = await Promise.all([
    prisma.contentChange.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contentChange.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { resolvedAt: "desc" },
      take: 10,
    }),
  ]);

return (
    <div>
      <h1 className="font-display text-3xl">Updates</h1>
      <p className="mt-1 text-sm text-text-muted">
        Content changes saved by admins go live only after you accept them here.
      </p>

<h2 className="mt-8 font-mono text-xs uppercase text-text-muted">
        Pending ({pending.length})
      </h2>
      <div className="mt-3 space-y-3">
        {pending.length === 0 && (
          <p className="text-sm text-text-muted">No pending changes. Everything is up to date.</p>
        )}
        {pending.map((c) => (
          <div key={c.id} className="index-card flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{c.title}</p>
              <p className="mt-0.5 font-mono text-xs text-text-muted">
                {new Date(c.createdAt).toLocaleString()} | {c.requestedByName ?? "Unknown"}
              </p>
            </div>
            <ContentChangeActions changeId={c.id} />
          </div>
        ))}
      </div>

<h2 className="mt-8 font-mono text-xs uppercase text-text-muted">Recently resolved</h2>
      <div className="mt-3 space-y-3">
        {recent.length === 0 && (
          <p className="text-sm text-text-muted">Nothing resolved yet.</p>
        )}
        {recent.map((c) => (
          <div key={c.id} className="index-card flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{c.title}</p>
              <p className="mt-0.5 font-mono text-xs text-text-muted">
                {c.status} | {c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : ""}
              </p>
            </div>
            <Link href={`/admin/content/${c.contentId}`} className="text-brass hover:text-brass-bright text-sm">
              View content
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
