import { prisma } from "@/lib/prisma";
import type { Permission, Role } from "@prisma/client";

/**
 * Roles that are allowed to ever hold ADMIN or SUPER_ADMIN.
 * VISITOR, USER, PREMIUM can never be promoted to these roles
 * through any user-facing action. Only a SUPER_ADMIN changing
 * the database directly (or via a protected admin-only server action)
 * can create an ADMIN or SUPER_ADMIN account.
 */
const PROMOTABLE_TO_ADMIN: Role[] = ["ADMIN", "SUPER_ADMIN"];

/**
 * Hard guard: prevents any code path from ever setting a VISITOR
 * account to ADMIN/SUPER_ADMIN through normal self-service flows.
 * Call this before any role update that originates from a
 * non-super-admin actor.
 */
export function assertRoleChangeAllowed(currentRole: Role, requestedRole: Role) {
  if (
    PROMOTABLE_TO_ADMIN.includes(requestedRole) &&
    currentRole === "VISITOR"
  ) {
    throw new Error(
      "VISITOR accounts can never be promoted directly to ADMIN or SUPER_ADMIN."
    );
  }
}

/**
 * Checks whether a user has a specific granular permission.
 * SUPER_ADMIN always has every permission implicitly.
 */
export async function hasPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role !== "ADMIN") return false;

  const grant = await prisma.adminPermission.findUnique({
    where: {
      userId_permission: {
        userId,
        permission,
      },
    },
  });

  return !!grant;
}

/**
 * Fetches all permissions granted to a given admin user.
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const grants = await prisma.adminPermission.findMany({
    where: { userId },
    select: { permission: true },
  });
  return grants.map((g) => g.permission);
}

/**
 * Determines whether a user (by role) can view a piece of content
 * based on its access level (NORMAL or PREMIUM).
 */
export function canAccessContent(
  userRole: Role | null | undefined,
  contentAccessLevel: "NORMAL" | "PREMIUM"
): boolean {
  if (contentAccessLevel === "NORMAL") return true;
  // PREMIUM content: only PREMIUM, ADMIN, SUPER_ADMIN can view.
  return userRole === "PREMIUM" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";
}