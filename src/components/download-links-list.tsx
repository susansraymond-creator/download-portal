"use client";

type Link = {
  id: string;
  providerName: string;
  fileSize: string | null;
  version: string | null;
  quality: string | null;
  language: string | null;
  notes: string | null;
  status: string;
};

export function DownloadLinksList({
  links,
  contentSlug,
}: {
  links: Link[];
  contentSlug: string;
}) {
  if (links.length === 0) {
    return (
      <p className="rounded-sm border border-dashed border-border p-6 text-sm text-text-muted">
        No active download links right now. Check back soon.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {links.map((link) => (
        <li
          key={link.id}
          className="index-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium text-text">{link.providerName}</p>
            <p className="mt-1 flex flex-wrap gap-x-3 font-mono text-[0.7rem] text-text-muted">
              {link.quality && <span>{link.quality}</span>}
              {link.version && <span>v{link.version}</span>}
              {link.language && <span>{link.language}</span>}
              {link.fileSize && <span>{link.fileSize}</span>}
            </p>
            {link.notes && <p className="mt-1 text-xs text-text-muted">{link.notes}</p>}
          </div>

          {/* Route through our own /api/download endpoint (not the raw
              external URL) so every click is authenticated, rate-limited,
              and logged before the user is redirected off-site. */}
          <a
            href={`/api/download/${link.id}?content=${contentSlug}`}
            className="shrink-0 rounded-sm bg-brass px-4 py-2 text-center text-sm font-medium text-ink hover:bg-brass-bright transition-colors"
          >
            Download
          </a>
        </li>
      ))}
    </ul>
  );
}
