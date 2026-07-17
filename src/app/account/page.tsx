import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const links = [
    { href: "/account/favorites", label: "Favorites" },
    { href: "/account/history", label: "Download history" },
    { href: "/account/notifications", label: "Notifications" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl">Your account</h1>
      <p className="mt-1 text-sm text-text-muted">
        Signed in as {session.user.email}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="index-card p-5 hover:border-brass">
            <p className="font-display text-lg">{l.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
