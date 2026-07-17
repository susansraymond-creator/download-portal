import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminContentListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const perPage = 20;

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { category: true, downloadLinks: { select: { id: true } } },
    }),
    prisma.content.count(),
  ]);

  const pages = Math.ceil(total / perPage);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Content</h1>
        <Link
          href="/admin/content/new"
          className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          + New content
        </Link>
      </div>

      <table className="mt-8 w-full text-sm">
        <thead className="border-b border-border text-left font-mono text-xs uppercase text-text-muted">
          <tr>
            <th className="py-2">Title</th>
            <th className="py-2">Type</th>
            <th className="py-2">Status</th>
            <th className="py-2">Links</th>
            <th className="py-2">Updated</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/50">
              <td className="py-2.5">{item.title}</td>
              <td className="py-2.5 text-text-muted">{item.type}</td>
              <td className="py-2.5">
                <span
                  className={`stamp ${
                    item.status === "PUBLISHED"
                      ? "text-teal"
                      : item.status === "DRAFT"
                        ? "text-text-muted"
                        : "text-brass"
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td className="py-2.5 text-text-muted">{item.downloadLinks.length}</td>
              <td className="py-2.5 font-mono text-xs text-text-muted">
                {item.updatedAt.toLocaleDateString()}
              </td>
              <td className="py-2.5 text-right">
                <Link href={`/admin/content/${item.id}`} className="text-brass hover:text-brass-bright">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pages > 1 && (
        <div className="mt-6 flex gap-2 font-mono text-xs">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/content?page=${p}`}
              className={`rounded-sm border px-3 py-1.5 ${
                p === page ? "border-brass text-brass" : "border-border text-text-muted"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
