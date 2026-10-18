import { getBadgeOptions } from "@/lib/badges";
import { BadgeManager } from "@/components/admin/badge-manager";

export default async function AdminBadgesPage() {
  const { qualities, languages } = await getBadgeOptions();

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl">Badges</h1>
      <p className="mb-8 text-sm text-text-muted">
        These options appear as dropdowns in the content form. Add new ones here whenever you need them.
      </p>
      <BadgeManager
        initialQualities={qualities.map((q) => ({ id: q.id, name: q.name }))}
        initialLanguages={languages.map((l) => ({ id: l.id, name: l.name }))}
      />
    </div>
  );
}