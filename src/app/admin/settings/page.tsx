import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const rows = await prisma.setting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Settings</h1>
      <SettingsForm
        initial={{
          siteName: (settings.siteName as string) ?? "The Stacks",
          siteDescription:
            (settings.siteDescription as string) ??
            "A curated download catalog for personally owned and licensed digital content.",
          contactEmail: (settings.contactEmail as string) ?? "",
          googleAnalyticsId: (settings.googleAnalyticsId as string) ?? "",
        }}
      />
    </div>
  );
}
