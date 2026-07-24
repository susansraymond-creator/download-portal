import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";
import { invalidateCache } from "@/lib/redis";

const seasonSchema = z.object({
  seasonNumber: z.number().int().min(1),
  title: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  posterUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { id } = await params;
  const seasons = await prisma.season.findMany({
    where: { contentId: id },
    orderBy: { seasonNumber: "asc" },
    include: { episodes: { orderBy: { episodeNumber: "asc" } } },
  });
  return NextResponse.json({ seasons });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { id } = await params;
  const parsed = seasonSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const season = await prisma.season.create({
    data: {
      contentId: id,
      seasonNumber: parsed.data.seasonNumber,
      title: parsed.data.title || null,
      description: parsed.data.description || null,
      posterUrl: parsed.data.posterUrl || null,
    },
  });

  await prisma.content.update({
    where: { id },
    data: { hasSeasons: true },
  });

  await invalidateCache("content:*");
  return NextResponse.json({ ok: true, season });
}