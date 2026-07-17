import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg">The Stacks</p>
            <p className="mt-2 max-w-xs text-sm text-text-muted">
              A personal archive of content the site owner holds the rights
              to distribute. Files live on external storage — this catalog
              only indexes them.
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
          © {new Date().getFullYear()} The Stacks. All indexed content is owned by, or
          distributed with written permission of, the site operator.
        </p>
      </div>
    </footer>
  );
}
