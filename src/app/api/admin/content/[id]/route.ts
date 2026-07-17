import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-guard";
import { contentSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { invalidateCache } from "@/lib/redis";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const content = await prisma.content.findUnique({
    where: { id },
    include: { downloadLinks: { orderBy: { sortOrder: "asc" } }, tags: true, category: true },
  });

  if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ content });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const parsed = contentSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await prisma.content.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }

  // Download links: full replace-on-edit keeps this endpoint simple and
  // avoids partial-update ordering bugs. For high-churn catalogs this could
  // be swapped for per-link PATCH endpoints (already scaffolded pattern).
  const updated = await prisma.$transaction(async (tx) => {
    if (data.downloadLinks) {
      await tx.downloadLink.deleteMany({ where: { contentId: id } });
    }

    return tx.content.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && {
          status: data.status,
          publishedAt:
            data.status === "PUBLISHED" && existing.status !== "PUBLISHED"
              ? new Date()
              : existing.publishedAt,
        }),
        ...(data.posterUrl !== undefined && { posterUrl: data.posterUrl }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
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
              url: l.url,
              fileSize: l.fileSize,
              version: l.version,
              quality: l.quality,
              language: l.language,
              notes: l.notes,
              status: l.status,
              sortOrder: l.sortOrder ?? i,
            })),
          },
        }),
      },
    });
  });

  await logAudit({
    userId: session!.user.id,
    action: "CONTENT_UPDATED",
    entity: "Content",
    entityId: id,
    ipAddress: getClientIp(req.headers),
  });

  await invalidateCache("content:*");

  return NextResponse.json({ ok: true, content: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  await prisma.content.delete({ where: { id } }).catch(() => null);

  await logAudit({
    userId: session!.user.id,
    action: "CONTENT_DELETED",
    entity: "Content",
    entityId: id,
    ipAddress: getClientIp(req.headers),
  });

  await invalidateCache("content:*");

  return NextResponse.json({ ok: true });
}
