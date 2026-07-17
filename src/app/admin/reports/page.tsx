import { prisma } from "@/lib/prisma";
import { ReportRow } from "@/components/admin/report-row";

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { content: { select: { title: true, slug: true } }, user: { select: { email: true } } },
  });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Reports</h1>
      <div className="space-y-3">
        {reports.map((r) => (
          <ReportRow
            key={r.id}
            report={{
              id: r.id,
              reason: r.reason,
              message: r.message,
              status: r.status,
              contentTitle: r.content.title,
              contentSlug: r.content.slug,
              reporter: r.user?.email ?? "Anonymous",
            }}
          />
        ))}
        {reports.length === 0 && <p className="text-text-muted">No reports filed.</p>}
      </div>
    </div>
  );
}
