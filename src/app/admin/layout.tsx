import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/updates", label: "Updates" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/badges", label: "Badges" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/backup", label: "Backup / Restore" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

const pendingCount = await prisma.contentChange.count({
    where: { status: "PENDING" },
  });

return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Mobile nav: horizontal scrollable pills */}
      <nav className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 whitespace-nowrap rounded-sm border border-border px-3 py-1.5 text-sm text-text-muted hover:text-text"
          >
            {item.label}
            {item.href === "/admin/updates" && pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-red-600 px-1.5 py-0.5 font-mono text-xs text-white">
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

<div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <p className="stamp mb-4 text-teal">Admin</p>
          <nav className="space-y-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-sm px-2 py-1.5 text-text-muted hover:bg-surface hover:text-text"
              >
                {item.label}
                {item.href === "/admin/updates" && pendingCount > 0 && (
                  <span className="ml-2 rounded-full bg-red-600 px-1.5 py-0.5 font-mono text-xs text-white">
                    {pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
