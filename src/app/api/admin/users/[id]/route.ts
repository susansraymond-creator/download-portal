import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requirePermission } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { assertRoleChangeAllowed } from "@/lib/permissions";

const PERMISSION_VALUES = [
  "MANAGE_CONTENT",
  "MANAGE_CATEGORIES",
  "MANAGE_TAGS",
  "MANAGE_USERS",
  "MANAGE_COMMENTS",
  "MANAGE_REPORTS",
  "MANAGE_DOWNLOAD_LINKS",
  "VIEW_ANALYTICS",
  "MANAGE_SETTINGS",
  "MANAGE_NOTIFICATIONS",
] as const;

const schema = z.object({
  role: z.enum(["VISITOR", "USER", "PREMIUM", "ADMIN", "SUPER_ADMIN"]).optional(),
  isBanned: z.boolean().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.enum(PERMISSION_VALUES)).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requirePermission("MANAGE_USERS");
  if (response) return response;

  const { id } = await params;
  const grants = await prisma.adminPermission.findMany({
    where: { userId: id },
    select: { permission: true },
  });
  return NextResponse.json({ permissions: grants.map((g) => g.permission) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requirePermission("MANAGE_USERS");
  if (response) return response;

  // Only a SUPER_ADMIN may grant or revoke admin roles, to prevent an
  // ADMIN from escalating other accounts (or themselves) to SUPER_ADMIN.
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { permissions, ...userPatch } = parsed.data;

  if ((userPatch.role || permissions) && session!.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only super admins can change roles or permissions." },
      { status: 403 }
    );
  }

  const targetBefore = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!targetBefore) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (userPatch.role) {
    try {
      assertRoleChangeAllowed(targetBefore.role, userPatch.role);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Role change not allowed" },
        { status: 400 }
      );
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: userPatch,
  });

  if (permissions) {
    await prisma.adminPermission.deleteMany({ where: { userId: id } });
    if (permissions.length > 0) {
      await prisma.adminPermission.createMany({
        data: permissions.map((permission) => ({
          userId: id,
          permission,
          grantedBy: session!.user.id,
        })),
        skipDuplicates: true,
      });
    }
  }

  await logAudit({
    userId: session!.user.id,
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    metadata: parsed.data,
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, role: user.role, isBanned: user.isBanned, isActive: user.isActive },
  });
}
