import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SearchBar } from "@/components/search-bar";
import { LogoutButton } from "@/components/logout-button";

const BADGE_COLORS = [
  "bg-red-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
  "bg-orange-600",
  "bg-pink-600",
  "bg-teal-600",
  "bg-indigo-600",
];

export async function SiteHeader() {
  const session = await auth();
  const [siteNameSetting, categories] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "siteName" } }).catch(() => null),
    prisma.category.findMany({
      where: { isHidden: false },
      orderBy: { name: "asc" },
      take: 12,
      select: { name: true, slug: true },
    }),
  ]);
  const siteName = (siteNameSetting?.value as string) || "The Stacks";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-xl tracking-tight text-text">
          {siteName}
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-text-muted md:flex">
          <Link href="/browse" className="hover:text-text">Browse</Link>
          <Link href="/browse?sort=newest" className="hover:text-text">Recently added</Link>
          <Link href="/browse?sort=popular" className="hover:text-text">Popular</Link>
          <Link href="/browse?featured=1" className="hover:text-text">Featured</Link>
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-4">
          <div className="hidden w-full max-w-sm sm:block">
            <SearchBar />
          </div>

          {session?.user ? (
            <div className="flex items-center gap-3 text-sm">
              {(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") && (
                <Link href="/admin" className="stamp text-teal">Admin</Link>
              )}
              <Link href="/account" className="text-text-muted hover:text-text">
                {session.user.name ?? "Account"}
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/login" className="text-text-muted hover:text-text">Log in</Link>
              <Link
                href="/register"
                className="rounded-sm border border-brass px-3 py-1.5 text-brass hover:bg-brass hover:text-ink transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="border-t border-border/50 bg-ink/60">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-2.5 sm:px-6">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                href={`/browse?category=${c.slug}`}
                className={`rounded-sm px-2.5 py-1 font-mono text-[0.65rem] font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-80 ${
                  BADGE_COLORS[i % BADGE_COLORS.length]
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
