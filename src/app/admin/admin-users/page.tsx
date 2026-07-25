import { prisma } from "@/lib/prisma";
import { UserRow } from "@/components/admin/user-row";
import { AddAdminForm } from "@/components/admin/add-admin-form";

export default async function AdminAdminUsersPage() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, name: true, email: true, role: true, isBanned: true, createdAt: true },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Admin Accounts</h1>
        <a href="/admin/users" className="text-sm text-teal hover:underline">
          ← Back to all users
        </a>
      </div>
      <p className="mb-6 text-sm text-text-muted">
        Manage administrator roles and granular permissions. Only super admins can promote,
        demote, or delete admin accounts.
      </p>
      <AddAdminForm />
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left font-mono text-xs uppercase text-text-muted">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Joined</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <UserRow key={u.id} user={u} roleOptions={["ADMIN", "SUPER_ADMIN"]} />
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <p className="mt-8 text-center text-text-muted">No admin accounts yet.</p>
      )}
    </div>
  );
}