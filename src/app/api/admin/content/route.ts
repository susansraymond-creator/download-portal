import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-guard";
import { contentSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { invalidateCache } from "@/lib/redis";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = 20;

  const [items, total] = await Promise.all([
    prisma.content.findMany({
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { category: true, downloadLinks: { select: { id: true, status: true } } },
    }),
    prisma.content.count(),
  ]);

  return NextResponse.json({ items, total, pages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const parsed = contentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const existingSlug = await prisma.content.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }

  const content = await prisma.content.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription,
      type: data.type,
      status: data.status,
      posterUrl: data.posterUrl,
      thumbnailUrl: data.thumbnailUrl,
      categoryId: data.categoryId,
      isFeatured: data.isFeatured,
      publishAt: data.publishAt ? new Date(data.publishAt) : null,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      canonicalUrl: data.canonicalUrl,
      authorId: session!.user.id,
      tags: { connect: data.tagIds.map((id) => ({ id })) },
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
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CONTENT_CREATED",
    entity: "Content",
    entityId: content.id,
    metadata: { title: content.title },
    ipAddress: getClientIp(req.headers),
  });

  await invalidateCache("content:*");

  return NextResponse.json({ ok: true, content });
}
