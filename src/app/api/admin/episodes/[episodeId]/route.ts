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

const episodePatchSchema = z.object({
  episodeNumber: z.number().int().min(1).optional(),
  episodeNumberLabel: episodeLabelSchema.optional().nullable(),
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  duration: z.string().optional(),
  watchUrl: z.string().url().optional().or(z.literal("")),
  downloadLinks: z.array(episodeLinkSchema).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  const { response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { episodeId } = await params;
  const parsed = episodePatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: { season: true },
  });
  if (!existing) return NextResponse.json({ error: "Episode not found" }, { status: 404 });

  // Reject duplicate serial numbers within the same season.
  if (
    parsed.data.episodeNumber !== undefined &&
    parsed.data.episodeNumber !== existing.episodeNumber
  ) {
    const duplicate = await prisma.episode.findUnique({
      where: {
        seasonId_episodeNumber: {
          seasonId: existing.seasonId,
          episodeNumber: parsed.data.episodeNumber,
        },
      },
    });
    if (duplicate) {
      return NextResponse.json({ error: "That episode number already exists" }, { status: 409 });
    }
  }

  const episode = await prisma.$transaction(async (tx) => {
    if (parsed.data.downloadLinks) {
      await tx.episodeDownloadLink.deleteMany({ where: { episodeId } });
    }

    return tx.episode.update({
      where: { id: episodeId },
      data: {
        ...(parsed.data.episodeNumber !== undefined && { episodeNumber: parsed.data.episodeNumber }),
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
        ...(parsed.data.thumbnailUrl !== undefined && { thumbnailUrl: parsed.data.thumbnailUrl || null }),
        ...(parsed.data.duration !== undefined && { duration: parsed.data.duration || null }),
        ...(parsed.data.watchUrl !== undefined && { watchUrl: parsed.data.watchUrl || null }),
        ...(parsed.data.downloadLinks !== undefined && {
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
        }),
      },
    });
  });

  // episodeNumberLabel is written via raw SQL until the Prisma client is
  // regenerated with the new optional field.
  if (parsed.data.episodeNumberLabel !== undefined) {
    await prisma.$executeRaw`UPDATE "Episode" SET "episodeNumberLabel" = ${parsed.data.episodeNumberLabel ?? null} WHERE "id" = ${episodeId}`;
  }

  // Bump the parent content's updatedAt so "Recently updated" reflects this edit.
  await prisma.content.update({
    where: { id: existing.season.contentId },
    data: { updatedAt: new Date() },
  });

  await invalidateCache("content:*");
  return NextResponse.json({
    ok: true,
    episode: { ...episode, episodeNumberLabel: parsed.data.episodeNumberLabel ?? null },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  const { response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { episodeId } = await params;
  await prisma.episode.delete({ where: { id: episodeId } }).catch(() => null);

  await invalidateCache("content:*");
  return NextResponse.json({ ok: true });
}
