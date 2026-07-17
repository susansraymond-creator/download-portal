import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  isBanned: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  // Only a SUPER_ADMIN may grant or revoke admin roles, to prevent an
  // ADMIN from escalating other accounts (or themselves) to SUPER_ADMIN.
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (parsed.data.role && session!.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can change roles." }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: parsed.data,
  });

  await logAudit({
    userId: session!.user.id,
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    metadata: parsed.data,
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, user: { id: user.id, role: user.role, isBanned: user.isBanned } });
}
