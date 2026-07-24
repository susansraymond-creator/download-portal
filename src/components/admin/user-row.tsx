"use client";
import { useState } from "react";

const ALL_PERMISSIONS = [
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

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isBanned: boolean;
  createdAt: Date;
};

export function UserRow({ user }: { user: User }) {
  const [role, setRole] = useState(user.role);
  const [isBanned, setIsBanned] = useState(user.isBanned);
  const [loading, setLoading] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  async function update(patch: Partial<{ role: string; isBanned: boolean; permissions: string[] }>) {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setLoading(false);
    if (res.ok) {
      if (patch.role) setRole(patch.role);
      if (patch.isBanned !== undefined) setIsBanned(patch.isBanned);
      if (patch.permissions) setPermissions(patch.permissions);
    }
  }

  async function openPermissions() {
    setShowPermissions((prev) => !prev);
    if (!permissionsLoaded) {
      const res = await fetch(`/api/admin/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions ?? []);
      }
      setPermissionsLoaded(true);
    }
  }

  function togglePermission(perm: string) {
    const next = permissions.includes(perm)
      ? permissions.filter((p) => p !== perm)
      : [...permissions, perm];
    update({ permissions: next });
  }

  return (
    <tr className="border-b border-border/50">
      <td className="py-2.5">{user.name ?? "—"}</td>
      <td className="py-2.5 text-text-muted">{user.email}</td>
      <td className="py-2.5">
        <select
          value={role}
          disabled={loading}
          onChange={(e) => update({ role: e.target.value })}
          className="rounded-sm border border-border bg-surface px-2 py-1 text-xs"
        >
          <option value="VISITOR">VISITOR</option>
          <option value="USER">USER</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
      </td>
      <td className="py-2.5 font-mono text-xs text-text-muted">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="py-2.5 text-right">
        <div className="flex items-center justify-end gap-2">
          {role === "ADMIN" && (
            <button
              onClick={openPermissions}
              className="stamp text-brass"
            >
              Permissions
            </button>
          )}
          <button
            disabled={loading}
            onClick={() => update({ isBanned: !isBanned })}
            className={`stamp ${isBanned ? "text-danger" : "text-teal"}`}
          >
            {isBanned ? "Banned" : "Active"}
          </button>
        </div>
        {showPermissions && role === "ADMIN" && (
          <div className="mt-2 flex flex-col gap-1 rounded-sm border border-border bg-surface p-3 text-left">
            {ALL_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-2 text-xs text-text-muted">
                <input
                  type="checkbox"
                  checked={permissions.includes(perm)}
                  disabled={loading}
                  onChange={() => togglePermission(perm)}
                />
                {perm}
              </label>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}
