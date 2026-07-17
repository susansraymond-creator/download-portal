import { prisma } from "@/lib/prisma";

export default async function AdminAnalyticsPage() {
  const [topContent, topProviders, recentEvents, dailyCounts] = await Promise.all([
    prisma.content.findMany({
      orderBy: { downloadCount: "desc" },
      take: 10,
      select: { id: true, title: true, downloadCount: true, viewCount: true },
    }),
    prisma.downloadLink.groupBy({
      by: ["providerName"],
      _sum: { clickCount: true },
      orderBy: { _sum: { clickCount: "desc" } },
      take: 10,
    }),
    prisma.downloadEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { content: { select: { title: true } } },
    }),
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt") as day, COUNT(*)::bigint as count
      FROM "DownloadEvent"
      WHERE "createdAt" > NOW() - INTERVAL '14 days'
      GROUP BY day
      ORDER BY day ASC
    `.catch(() => []),
  ]);

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Analytics</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-lg">Top content by downloads</h2>
          <table className="w-full text-sm">
            <tbody>
              {topContent.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2">{c.title}</td>
                  <td className="py-2 text-right font-mono text-xs text-text-muted">
                    {c.downloadCount} dl / {c.viewCount} views
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg">Top providers by clicks</h2>
          <table className="w-full text-sm">
            <tbody>
              {topProviders.map((p) => (
                <tr key={p.providerName} className="border-b border-border/50">
                  <td className="py-2">{p.providerName}</td>
                  <td className="py-2 text-right font-mono text-xs text-text-muted">
                    {p._sum.clickCount ?? 0} clicks
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg">Downloads, last 14 days</h2>
          <ul className="space-y-1 font-mono text-xs text-text-muted">
            {dailyCounts.map((d) => (
              <li key={d.day.toString()} className="flex justify-between">
                <span>{new Date(d.day).toLocaleDateString()}</span>
                <span>{d.count.toString()}</span>
              </li>
            ))}
            {dailyCounts.length === 0 && <li>No recent activity.</li>}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg">Recent downloads</h2>
          <ul className="space-y-1 text-xs text-text-muted">
            {recentEvents.map((e) => (
              <li key={e.id} className="flex justify-between">
                <span>{e.content.title}</span>
                <span className="font-mono">{e.createdAt.toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
