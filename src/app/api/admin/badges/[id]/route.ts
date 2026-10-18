import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requirePermission("MANAGE_CATEGORIES");
  if (response) return response;

  const { id } = await params;
  await prisma.badgeOption.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}