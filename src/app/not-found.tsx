import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="stamp text-brass">Error 404</p>
      <h1 className="mt-4 font-display text-4xl leading-tight">
        This page isn&apos;t in the catalog.
      </h1>
      <p className="mt-4 text-text-muted">
        The page you&apos;re looking for may have been moved, renamed, or never existed.
        Try browsing the catalog instead.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-sm bg-brass px-5 py-2.5 text-sm font-medium text-ink hover:bg-brass-bright transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/browse"
          className="rounded-sm border border-border px-5 py-2.5 text-sm text-text-muted hover:text-text hover:border-text-muted transition-colors"
        >
          Browse the catalog
        </Link>
      </div>
    </div>
  );
}