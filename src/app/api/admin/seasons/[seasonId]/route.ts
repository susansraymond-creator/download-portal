import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";
import { invalidateCache } from "@/lib/redis";

const seasonPatchSchema = z.object({
  seasonNumber: z.number().int().min(1).optional(),
  title: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  posterUrl: z.string().url().optional().or(z.literal("")),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { seasonId } = await params;
  const parsed = seasonPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { id: true, contentId: true, seasonNumber: true },
  });
  if (!existing) return NextResponse.json({ error: "Season not found" }, { status: 404 });

  // Reject duplicate season numbers within the same content.
  if (
    parsed.data.seasonNumber !== undefined &&
    parsed.data.seasonNumber !== existing.seasonNumber
  ) {
    const duplicate = await prisma.season.findUnique({
      where: {
        contentId_seasonNumber: {
          contentId: existing.contentId,
          seasonNumber: parsed.data.seasonNumber,
        },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "That season number already exists for this content" },
        { status: 409 }
      );
    }
  }

  const season = await prisma.season.update({
    where: { id: seasonId },
    data: {
      ...(parsed.data.seasonNumber !== undefined && { seasonNumber: parsed.data.seasonNumber }),
      ...(parsed.data.title !== undefined && { title: parsed.data.title || null }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
      ...(parsed.data.posterUrl !== undefined && { posterUrl: parsed.data.posterUrl || null }),
    },
  });

  // Keep the parent content's updatedAt fresh and drop cached pages.
  await prisma.content.update({
    where: { id: existing.contentId },
    data: { updatedAt: new Date() },
  });
  await invalidateCache("content:*");
  return NextResponse.json({ ok: true, season });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { seasonId } = await params;
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    select: { contentId: true },
  });
  await prisma.season.delete({ where: { id: seasonId } }).catch(() => null);

  if (season) {
    await prisma.content
      .update({ where: { id: season.contentId }, data: { updatedAt: new Date() } })
      .catch(() => {});
  }
  await invalidateCache("content:*");
  return NextResponse.json({ ok: true });
}
