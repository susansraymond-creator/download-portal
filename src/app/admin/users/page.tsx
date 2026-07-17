import { prisma } from "@/lib/prisma";
import { UserRow } from "@/components/admin/user-row";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, name: true, email: true, role: true, isBanned: true, createdAt: true },
  });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Users</h1>
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
            <UserRow key={u.id} user={u} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
