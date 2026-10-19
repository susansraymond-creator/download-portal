import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";
import { invalidateCache } from "@/lib/redis";

const schema = z.object({ isFeatured: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const existing = await prisma.content.findUnique({
    where: { id },
    select: { updatedAt: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Keep the old updatedAt so pinning/unpinning doesn't reshuffle "recently updated".
  const content = await prisma.content.update({
    where: { id },
    data: { isFeatured: parsed.data.isFeatured, updatedAt: existing.updatedAt },
    select: { id: true, isFeatured: true },
  });

  await invalidateCache("content:*");
  return NextResponse.json({ ok: true, content });
}