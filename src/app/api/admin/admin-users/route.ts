import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { assertRoleChangeAllowed } from "@/lib/permissions";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  if (session!.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only super admins can add admins." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json(
      { error: "No account found with that email. The user must register first." },
      { status: 404 }
    );
  }

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "This user is already an admin." }, { status: 400 });
  }

  try {
    assertRoleChangeAllowed(user.role, "ADMIN");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Role change not allowed" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  await logAudit({
    userId: session!.user.id,
    action: "USER_UPDATED",
    entity: "User",
    entityId: user.id,
    metadata: { role: "ADMIN", promotedBy: session!.user.email },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({
    ok: true,
    user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
  });
}