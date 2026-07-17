"use client";

import { useState } from "react";

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

  async function update(patch: Partial<{ role: string; isBanned: boolean }>) {
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
    }
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
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
      </td>
      <td className="py-2.5 font-mono text-xs text-text-muted">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="py-2.5 text-right">
        <button
          disabled={loading}
          onClick={() => update({ isBanned: !isBanned })}
          className={`stamp ${isBanned ? "text-danger" : "text-teal"}`}
        >
          {isBanned ? "Banned" : "Active"}
        </button>
      </td>
    </tr>
  );
}
