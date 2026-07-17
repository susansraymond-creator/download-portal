import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const [content, categories, tags] = await Promise.all([
    prisma.content.findMany({
      include: { downloadLinks: true, tags: { select: { slug: true } } },
    }),
    prisma.category.findMany(),
    prisma.tag.findMany(),
  ]);

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    version: 1,
    categories,
    tags,
    content,
  });
}

const importSchema = z.object({
  version: z.number(),
  categories: z.array(z.any()).default([]),
  tags: z.array(z.any()).default([]),
  content: z.array(z.any()).default([]),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const parsed = importSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid backup file format." }, { status: 400 });
  }

  let imported = 0;

  for (const cat of parsed.data.categories) {
    if (!cat.slug || !cat.name) continue;
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug, description: cat.description ?? null },
      update: {},
    });
  }

  for (const tag of parsed.data.tags) {
    if (!tag.slug || !tag.name) continue;
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      create: { name: tag.name, slug: tag.slug },
      update: {},
    });
  }

  for (const item of parsed.data.content) {
    if (!item.slug || !item.title) continue;
    const existing = await prisma.content.findUnique({ where: { slug: item.slug } });
    if (existing) continue;

    await prisma.content.create({
      data: {
        title: item.title,
        slug: item.slug,
        description: item.description ?? "",
        shortDescription: item.shortDescription ?? null,
        type: item.type ?? "DOCUMENT",
        status: "DRAFT", // Imported items land as drafts for manual review.
        posterUrl: item.posterUrl ?? null,
        thumbnailUrl: item.thumbnailUrl ?? null,
        authorId: session!.user.id,
        downloadLinks: {
          create: (item.downloadLinks ?? []).map((l: Record<string, unknown>) => ({
            providerName: l.providerName,
            url: l.url,
            fileSize: l.fileSize ?? null,
            version: l.version ?? null,
            quality: l.quality ?? null,
            language: l.language ?? null,
            notes: l.notes ?? null,
            status: l.status ?? "ACTIVE",
          })),
        },
      },
    });
    imported++;
  }

  await logAudit({
    userId: session!.user.id,
    action: "BACKUP_RESTORED",
    entity: "Content",
    metadata: { imported },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, imported });
}
