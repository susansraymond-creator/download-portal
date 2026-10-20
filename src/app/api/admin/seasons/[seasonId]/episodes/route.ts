import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";
import { invalidateCache } from "@/lib/redis";

// Episode serial labels may be a single number ("3") or a range ("1-10").
// Digits separated by a hyphen, space, en dash (u2013) or em dash (u2014).
const episodeLabelSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:[ \u002d\u2013\u2014]\d+)?$/, "Use a number or range such as 1-10");

const episodeLinkSchema = z.object({
  providerName: z.string().min(1).default("Server"),
  url: z.string().url().optional().or(z.literal("")),
  embedUrl: z.string().url().optional().or(z.literal("")),
  fileSize: z.string().optional(),
  quality: z.string().optional(),
  language: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "DISABLED", "BROKEN"]).default("ACTIVE"),
});

const episodeSchema = z.object({
  episodeNumber: z.number().int().min(1),
  episodeNumberLabel: episodeLabelSchema.optional().nullable(),
  title: z.string().min(1).max(150),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  duration: z.string().optional(),
  watchUrl: z.string().url().optional().or(z.literal("")),
  downloadLinks: z.array(episodeLinkSchema).default([]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { seasonId } = await params;
  const episodes = await prisma.episode.findMany({
    where: { seasonId },
    orderBy: { episodeNumber: "asc" },
    include: { downloadLinks: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json({ episodes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { seasonId } = await params;
  const parsed = episodeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 });

  // Reject duplicate serial numbers within the same season.
  const duplicate = await prisma.episode.findUnique({
    where: {
      seasonId_episodeNumber: {
        seasonId,
        episodeNumber: parsed.data.episodeNumber,
      },
    },
  });
  if (duplicate) {
    return NextResponse.json({ error: "That episode number already exists" }, { status: 409 });
  }

  const episode = await prisma.episode.create({
    data: {
      seasonId,
      episodeNumber: parsed.data.episodeNumber,
      title: parsed.data.title,
      description: parsed.data.description || null,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      duration: parsed.data.duration || null,
      watchUrl: parsed.data.watchUrl || null,
      downloadLinks: {
        create: parsed.data.downloadLinks.map((l, i) => ({
          providerName: l.providerName,
          url: l.url || l.embedUrl || "#",
          embedUrl: l.embedUrl || null,
          fileSize: l.fileSize || null,
          quality: l.quality || null,
          language: l.language || null,
          notes: l.notes || null,
          status: l.status,
          sortOrder: i,
        })),
      },
    },
  });

  // episodeNumberLabel is written via raw SQL until the Prisma client is
  // regenerated with the new optional field.
  if (parsed.data.episodeNumberLabel) {
    await prisma.$executeRaw`UPDATE "Episode" SET "episodeNumberLabel" = ${parsed.data.episodeNumberLabel} WHERE "id" = ${episode.id}`;
  }

  // Bump the parent content's updatedAt so "Recently updated" reflects
  // the new episode.
  await prisma.content.update({
    where: { id: season.contentId },
    data: { updatedAt: new Date() },
  });

  await invalidateCache("content:*");
  return NextResponse.json({
    ok: true,
    episode: { ...episode, episodeNumberLabel: parsed.data.episodeNumberLabel ?? null },
  });
}
