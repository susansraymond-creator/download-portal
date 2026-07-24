import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";
import { invalidateCache } from "@/lib/redis";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requirePermission("MANAGE_TAGS");
  if (response) return response;

  const { id } = await params;
  await prisma.tag.delete({ where: { id } }).catch(() => null);

  await invalidateCache("content:*");
  return NextResponse.json({ ok: true });
}