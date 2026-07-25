import Link from "next/link";
import { prisma } from "@/lib/prisma";
export async function SiteFooter() {
  const [siteNameSetting, descSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "siteName" } }).catch(() => null),
    prisma.setting.findUnique({ where: { key: "siteDescription" } }).catch(() => null),
  ]);
  const siteName = (siteNameSetting?.value as string) || "The Stacks";
  const siteDescription =
    (descSetting?.value as string) ||
    "A personal archive of content the site owner holds the rights to distribute. Files live on external storage — this catalog only indexes them.";
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg">{siteName}</p>
            <p className="mt-2 max-w-xs text-sm text-text-muted">
              {siteDescription}
            </p>
          </div>

          <div className="text-sm">
            <p className="mb-2 font-mono uppercase tracking-wide text-text-muted">Browse</p>
            <ul className="space-y-1.5 text-text-muted">
              <li><Link href="/browse" className="hover:text-text">All content</Link></li>
              <li><Link href="/browse?sort=newest" className="hover:text-text">Recently added</Link></li>
              <li><Link href="/browse?sort=popular" className="hover:text-text">Popular</Link></li>
            </ul>
          </div>

          <div className="text-sm">
            <p className="mb-2 font-mono uppercase tracking-wide text-text-muted">Legal</p>
            <ul className="space-y-1.5 text-text-muted">
              <li><Link href="/dmca" className="hover:text-text">Copyright / DMCA</Link></li>
              <li><Link href="/terms" className="hover:text-text">Terms of use</Link></li>
              <li><Link href="/privacy" className="hover:text-text">Privacy policy</Link></li>
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-border pt-6 text-xs text-text-muted">
          © {new Date().getFullYear()} {siteName}. All indexed content is owned by, or
          distributed with written permission of, the site operator.
        </p>
      </div>
    </footer>
  );
}
