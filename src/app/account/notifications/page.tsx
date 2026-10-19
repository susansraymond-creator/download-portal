import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account/notifications");

async function markAllRead() {
    "use server";
    const s = await auth();
    if (!s?.user) return;
    await prisma.notification.updateMany({
      where: { userId: s.user.id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/account/notifications");
  }

const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Notifications</h1>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="rounded-sm border border-brass px-3 py-1.5 text-xs font-mono text-brass hover:bg-brass hover:text-ink"
            >
              Mark all as read ({unreadCount})
            </button>
          </form>
        )}
      </div>

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
