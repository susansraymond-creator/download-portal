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
  category: { name: string; slug: string } | null;
};

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

  return (
    <Link
      href={`/content/${content.slug}`}
      className="index-card group flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-raised">
        {image ? (
          <Image
            src={image}
            alt={content.title}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs text-text-muted">
            NO PREVIEW
          </div>
        )}
        {content.isFeatured && (
          <span className="stamp absolute right-2 top-2 bg-ink/80 text-brass-bright">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-wide text-text-muted">
          <span>{TYPE_LABELS[content.type] ?? content.type}</span>
          {content.category && <span>{content.category.name}</span>}
        </div>

        <h3 className="font-display text-base leading-snug text-text group-hover:text-brass-bright">
          {content.title}
        </h3>

        {content.shortDescription && (
          <p className="line-clamp-2 text-sm text-text-muted">{content.shortDescription}</p>
        )}

        <p className="mt-auto pt-2 font-mono text-[0.65rem] text-text-muted">
          {content.downloadCount.toLocaleString()} downloads
        </p>
      </div>
    </Link>
  );
}
