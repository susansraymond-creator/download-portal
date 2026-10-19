import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";
import { invalidateCache } from "@/lib/redis";
import { getClientIp } from "@/lib/rate-limit";
import { notifyNewContent } from "@/lib/notifications";

type PendingLink = {
  providerName: string;
  url: string;
  embedUrl?: string | null;
  fileSize?: string | null;
  version?: string | null;
  quality?: string | null;
  language?: string | null;
  notes?: string | null;
  status?: "ACTIVE" | "DISABLED" | "BROKEN";
  sortOrder?: number;
};

type PendingData = {
  title?: string;
  slug?: string;
  description?: string;
  shortDescription?: string | null;
  type?: string;
  status?: string;
  posterUrl?: string | null;
  thumbnailUrl?: string | null;
  categoryId?: string | null;
  isFeatured?: boolean;
  hasSeasons?: boolean;
  accessLevel?: string;
  imdbRating?: number | null;
  primaryQuality?: string | null;
  primaryLanguage?: string | null;
  updateLabel?: string | null;
  seriesStatus?: string | null;
  watchUrl?: string | null;
  publishAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  tagIds?: string[];
  downloadLinks?: PendingLink[];
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

const { id } = await params;

const change = await prisma.contentChange.findUnique({ where: { id } });
  if (!change || change.status !== "PENDING") {
    return NextResponse.json({ error: "Pending change not found" }, { status: 404 });
  }

const data = change.data as unknown as PendingData;
  const existing = await prisma.content.findUnique({ where: { id: change.contentId } });
  if (!existing) {
    return NextResponse.json({ error: "Content no longer exists" }, { status: 404 });
  }

if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await prisma.content.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }

const updated = await prisma.$transaction(async (tx) => {
    if (data.downloadLinks) {
      await tx.downloadLink.deleteMany({ where: { contentId: change.contentId } });
    }

return tx.content.update({
      where: { id: change.contentId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.type !== undefined && { type: data.type as never }),
        ...(data.status !== undefined && {
          status: data.status as never,
          publishedAt:
            data.status === "PUBLISHED" && existing.status !== "PUBLISHED"
              ? new Date()
              : existing.publishedAt,
        }),
        ...(data.posterUrl !== undefined && { posterUrl: data.posterUrl }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.hasSeasons !== undefined && { hasSeasons: data.hasSeasons }),
        ...(data.accessLevel !== undefined && { accessLevel: data.accessLevel as never }),
        ...(data.imdbRating !== undefined && { imdbRating: data.imdbRating }),
        ...(data.primaryQuality !== undefined && { primaryQuality: data.primaryQuality }),
        ...(data.primaryLanguage !== undefined && { primaryLanguage: data.primaryLanguage }),
        ...(data.updateLabel !== undefined && { updateLabel: data.updateLabel }),
        ...(data.seriesStatus !== undefined && { seriesStatus: data.seriesStatus as never }),
        ...(data.watchUrl !== undefined && { watchUrl: data.watchUrl }),
        ...(data.publishAt !== undefined && {
          publishAt: data.publishAt ? new Date(data.publishAt) : null,
        }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
        ...(data.canonicalUrl !== undefined && { canonicalUrl: data.canonicalUrl }),
        ...(data.tagIds !== undefined && { tags: { set: data.tagIds.map((tid) => ({ id: tid })) } }),
        ...(data.downloadLinks !== undefined && {
          downloadLinks: {
            create: data.downloadLinks.map((l, i) => ({
              providerName: l.providerName,
              url: l.url || l.embedUrl || "#",
              embedUrl: l.embedUrl,
              fileSize: l.fileSize,
              version: l.version,
              quality: l.quality,
              language: l.language,
              notes: l.notes,
              status: (l.status ?? "ACTIVE") as never,
              sortOrder: l.sortOrder ?? i,
            })),
          },
        }),
      },
    });
  });

await prisma.contentChange.update({
    where: { id },
    data: { status: "ACCEPTED", resolvedAt: new Date(), resolvedBy: session!.user.id },
  });

await logAudit({
    userId: session!.user.id,
    action: "CONTENT_CHANGE_ACCEPTED",
    entity: "Content",
    entityId: change.contentId,
    ipAddress: getClientIp(_req.headers),
  });

await invalidateCache("content:*");

if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    await notifyNewContent(updated).catch(() => {});
  }

return NextResponse.json({ ok: true, content: updated });
}
