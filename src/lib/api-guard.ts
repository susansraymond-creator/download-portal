import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@prisma/client";

/**
 * Ensures the current request is from an authenticated admin
 * (ADMIN or SUPER_ADMIN). Returns either the session or a 401/403 response.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, response: null };
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, response: null };
}

/**
 * Ensures the current request is from an admin who either is SUPER_ADMIN
 * or has been explicitly granted the given permission.
 */
export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  const allowed = await hasPermission(session.user.id, permission);
  if (!allowed) {
    return {
      session: null,
      response: NextResponse.json({ error: "Missing permission" }, { status: 403 }),
    };
  }
  return { session, response: null };
}