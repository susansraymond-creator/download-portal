import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/history");

  const events = await prisma.downloadEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      content: { select: { title: true, slug: true } },
      downloadLink: { select: { providerName: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl">Download history</h1>

      {events.length === 0 ? (
        <p className="mt-8 text-text-muted">No downloads yet.</p>
      ) : (
        <table className="mt-8 w-full text-sm">
          <thead className="border-b border-border text-left font-mono text-xs uppercase text-text-muted">
            <tr>
              <th className="py-2">Title</th>
              <th className="py-2">Provider</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-border/50">
                <td className="py-2">
                  <Link href={`/content/${e.content.slug}`} className="hover:text-brass">
                    {e.content.title}
                  </Link>
                </td>
                <td className="py-2 text-text-muted">{e.downloadLink.providerName}</td>
                <td className="py-2 font-mono text-xs text-text-muted">
                  {e.createdAt.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
