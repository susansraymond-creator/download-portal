import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

const { id } = await params;

const change = await prisma.contentChange.findUnique({ where: { id } });
  if (!change || change.status !== "PENDING") {
    return NextResponse.json({ error: "Pending change not found" }, { status: 404 });
  }

await prisma.contentChange.update({
    where: { id },
    data: { status: "DECLINED", resolvedAt: new Date(), resolvedBy: session!.user.id },
  });

await logAudit({
    userId: session!.user.id,
    action: "CONTENT_CHANGE_DECLINED",
    entity: "Content",
    entityId: change.contentId,
    ipAddress: getClientIp(_req.headers),
  });

return NextResponse.json({ ok: true });
}
