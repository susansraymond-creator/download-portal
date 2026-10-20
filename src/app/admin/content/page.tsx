import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ContentPinButton from "@/components/admin/content-pin-button";
import ContentSearch from "@/components/admin/content-search";

export default async function AdminContentListPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { page: pageParam, q: qParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const perPage = 20;
  const q = (qParam ?? "").trim();
  const where = q ? { title: { contains: q, mode: "insensitive" as const } } : undefined;
  const [items, total] = await Promise.all([
    prisma.content.findMany({ where, orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * perPage, take: perPage, include: { category: true, downloadLinks: { select: { id: true } } } }),
    prisma.content.count({ where }),
  ]);
  const pages = Math.ceil(total / perPage);
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl">Content</h1><Link href="/admin/content/new" className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright">+ New content</Link></div>
      <div className="mt-6 max-w-xl"><ContentSearch initialQuery={q} /></div>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="border-b border-border text-left font-mono text-xs uppercase text-text-muted"><tr><th className="py-2">Title</th><th className="py-2">Status</th><th className="py-2">Links</th><th className="py-2">Added</th><th className="py-2">Pin</th><th className="py-2" /></tr></thead><tbody>
        {items.length === 0 && <tr><td colSpan={6} className="py-6 text-text-muted">{q ? `No results for "${q}".` : "No content yet."}</td></tr>}
        {items.map((item) => <tr key={item.id} className="border-b border-border/50"><td className="py-2.5">{item.title}</td><td className="py-2.5"><span className={`stamp ${item.status === "PUBLISHED" ? "text-teal" : item.status === "DRAFT" ? "text-text-muted" : "text-brass"}`}>{item.status}</span></td><td className="py-2.5 text-text-muted">{item.downloadLinks.length}</td><td className="py-2.5 font-mono text-xs text-text-muted">{item.createdAt.toLocaleDateString()}</td><td className="py-2.5"><ContentPinButton contentId={item.id} isFeatured={item.isFeatured} /></td><td className="py-2.5 text-right"><Link href={`/admin/content/${item.id}`} className="text-brass hover:text-brass-bright">Edit</Link></td></tr>)}
      </tbody></table></div>
      {pages > 1 && <div className="mt-6 flex gap-2 font-mono text-xs">{Array.from({ length: pages }, (_, i) => i + 1).map((p) => <Link key={p} href={`/admin/content?page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`rounded-sm border px-3 py-1.5 ${p === page ? "border-brass text-brass" : "border-border text-text-muted"}`}>{p}</Link>)}</div>}
    </div>
  );
}
