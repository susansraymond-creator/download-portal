import Link from "next/link";
import { auth } from "@/lib/auth";
import { SearchBar } from "@/components/search-bar";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-xl tracking-tight text-text">
          The <span className="text-brass">Stacks</span>
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
    </header>
  );
}
