import { prisma } from "@/lib/prisma";
import { UserRow } from "@/components/admin/user-row";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["VISITOR", "USER", "PREMIUM"] } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, name: true, email: true, role: true, isBanned: true, createdAt: true },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Users</h1>
        <a href="/admin/admin-users" className="text-sm text-teal hover:underline">
          Manage Admins →
        </a>
      </div>
      <div className="overflow-x-auto">`n      <table className="w-full min-w-[560px] text-sm">
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
            <UserRow key={u.id} user={u} roleOptions={["USER", "PREMIUM"]} />
          ))}
        </tbody>
      </table>`n      </div>
    </div>
  );
}

