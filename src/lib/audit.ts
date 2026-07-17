import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata as never,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    // Audit logging must never break the primary request.
    console.error("Failed to write audit log", err);
  }
}
