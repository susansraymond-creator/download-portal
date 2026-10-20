import { prisma } from "@/lib/prisma";
import { ContentEditorForm } from "@/components/admin/content-editor-form";
import { getBadgeOptions } from "@/lib/badges";

export default async function NewContentPage() {
  const [categories, badgeOptions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getBadgeOptions(),
  ]);

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">New content</h1>
      <ContentEditorForm
        categories={categories}
        qualityOptions={badgeOptions.qualities.map((q) => q.name)}
        languageOptions={badgeOptions.languages.map((l) => l.name)}
      />
    </div>
  );
}
