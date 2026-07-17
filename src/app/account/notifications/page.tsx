import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="mt-8 text-text-muted">You&apos;re all caught up.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`index-card p-4 ${n.isRead ? "opacity-60" : ""}`}
            >
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 text-sm text-text-muted">{n.message}</p>
              <p className="mt-2 font-mono text-[0.65rem] text-text-muted">
                {n.createdAt.toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
