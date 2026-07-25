import { prisma } from "@/lib/prisma";

const ACTION_COLORS: Record<string, string> = {
  CONTENT_CREATED: "text-teal",
  CONTENT_UPDATED: "text-brass",
  CONTENT_DELETED: "text-danger",
  USER_UPDATED: "text-brass",
  SETTINGS_UPDATED: "text-brass",
  BACKUP_RESTORED: "text-teal",
};

export default async function AdminAuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Audit Log</h1>
      <p className="mb-6 text-sm text-text-muted">
        Most recent 100 admin actions. Every content, user, and settings change is recorded here.
      </p>

      <table className="w-full text-sm">
        <thead className="border-b border-border text-left font-mono text-xs uppercase text-text-muted">
          <tr>
            <th className="py-2">When</th>
            <th className="py-2">Admin</th>
            <th className="py-2">Action</th>
            <th className="py-2">Entity</th>
            <th className="py-2">IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-border/50">
              <td className="py-2 font-mono text-xs text-text-muted">
                {log.createdAt.toLocaleString()}
              </td>
              <td className="py-2">
                {log.user?.name ?? log.user?.email ?? "System"}
              </td>
              <td className={`py-2 font-mono text-xs ${ACTION_COLORS[log.action] ?? "text-text-muted"}`}>
                {log.action}
              </td>
              <td className="py-2 font-mono text-xs text-text-muted">
                {log.entity}
                {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}
              </td>
              <td className="py-2 font-mono text-xs text-text-muted">{log.ipAddress ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length === 0 && (
        <p className="mt-8 text-center text-text-muted">No admin actions recorded yet.</p>
      )}
    </div>
  );
}