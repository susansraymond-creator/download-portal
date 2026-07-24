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

  const season = await prisma.season.update({
    where: { id: seasonId },
    data: {
      ...(parsed.data.seasonNumber !== undefined && { seasonNumber: parsed.data.seasonNumber }),
      ...(parsed.data.title !== undefined && { title: parsed.data.title || null }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
      ...(parsed.data.posterUrl !== undefined && { posterUrl: parsed.data.posterUrl || null }),
    },
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
  await prisma.season.delete({ where: { id: seasonId } }).catch(() => null);

  await invalidateCache("content:*");
  return NextResponse.json({ ok: true });
}