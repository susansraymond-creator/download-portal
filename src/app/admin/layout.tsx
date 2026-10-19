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
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-10 sm:px-6">
      <aside className="w-48 shrink-0">
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
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
