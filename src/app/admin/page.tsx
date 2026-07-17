import { prisma } from "@/lib/prisma";

export default async function AdminOverviewPage() {
  const [totalContent, published, drafts, totalUsers, totalDownloads, openReports] =
    await Promise.all([
      prisma.content.count(),
      prisma.content.count({ where: { status: "PUBLISHED" } }),
      prisma.content.count({ where: { status: "DRAFT" } }),
      prisma.user.count(),
      prisma.downloadEvent.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
    ]);

  const stats = [
    { label: "Total content", value: totalContent },
    { label: "Published", value: published },
    { label: "Drafts", value: drafts },
    { label: "Users", value: totalUsers },
    { label: "Total downloads", value: totalDownloads },
    { label: "Open reports", value: openReports },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl">Overview</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="index-card p-5">
            <p className="font-mono text-xs uppercase text-text-muted">{s.label}</p>
            <p className="mt-2 font-display text-3xl text-brass">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
