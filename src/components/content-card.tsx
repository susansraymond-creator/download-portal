import Link from "next/link";
import Image from "next/image";
type CardContent = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  type: string;
  thumbnailUrl: string | null;
  posterUrl: string | null;
  isFeatured: boolean;
  downloadCount: number;
  viewCount: number;
  imdbRating: number | null;
  primaryQuality?: string | null;
  primaryLanguage?: string | null;
  updateLabel?: string | null;
  updatedAt?: Date;
  createdAt?: Date;
  category: { name: string; slug: string } | null;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const TYPE_LABELS: Record<string, string> = {
  VIDEO: "Video",
  COURSE: "Course",
  TUTORIAL: "Tutorial",
  DOCUMENT: "Document",
  SOFTWARE: "Software",
  AUDIO: "Audio",
  IMAGE: "Image",
  ARCHIVE: "Archive",
};

export function ContentCard({ content }: { content: CardContent }) {
  const image = content.thumbnailUrl || content.posterUrl;
  const updated = content.updatedAt ?? content.createdAt;

  return (
    <Link
      href={`/content/${content.slug}`}
      className="index-card group flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-raised">
        {image ? (
          <Image
            src={image}
            alt={content.title}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-text-muted">
            NO PREVIEW
          </div>
        )}

        {content.imdbRating != null && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-sm bg-ink/85 px-1.5 py-0.5 font-mono text-[0.65rem] font-bold text-brass">
            ★ {content.imdbRating.toFixed(1)}
          </span>
        )}

        {content.isFeatured && (
          <span className="stamp absolute right-2 top-2 rounded-sm bg-brass px-1.5 py-0.5 text-[0.6rem] font-bold text-ink">
            PINNED
          </span>
        )}

        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
          {content.primaryQuality && (
            <span className="rounded-sm bg-ink/85 px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-teal-bright">
              {content.primaryQuality}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {content.primaryLanguage && (
            <span className="rounded-sm bg-teal px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-ink">
              {content.primaryLanguage.toUpperCase()}
            </span>
          )}
          <span className="rounded-sm bg-danger/90 px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-white">
            {(content.category?.name || TYPE_LABELS[content.type] || content.type).toUpperCase()}
          </span>
        </div>

        {content.updateLabel && (
          <span className="w-fit rounded-sm border border-teal/50 px-1.5 py-0.5 font-mono text-[0.6rem] text-teal">
            {content.updateLabel}
          </span>
        )}

        <h3 className="line-clamp-2 font-display text-sm leading-snug text-text group-hover:text-brass-bright">
          {content.title}
        </h3>

        <p className="mt-auto flex items-center justify-between pt-1 font-mono text-[0.6rem] text-text-muted">
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {content.viewCount.toLocaleString()}
          </span>
          {updated && <span>{timeAgo(updated)}</span>}
        </p>
      </div>
    </Link>
  );
}