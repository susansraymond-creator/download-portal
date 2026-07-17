import { BackupPanel } from "@/components/admin/backup-panel";

export default function AdminBackupPage() {
  return (
    <div>
      <h1 className="mb-4 font-display text-3xl">Backup / Restore</h1>
      <p className="mb-8 max-w-xl text-sm text-text-muted">
        Export the full catalog (content, categories, tags, and download
        links — no user data or passwords) as JSON, or restore from a
        previously exported file. For full database backups, use{" "}
        <code className="font-mono text-xs">pg_dump</code> against your
        Postgres instance directly (see README).
      </p>
      <BackupPanel />
    </div>
  );
}
