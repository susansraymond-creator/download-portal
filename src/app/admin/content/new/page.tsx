import { prisma } from "@/lib/prisma";
import { ContentEditorForm } from "@/components/admin/content-editor-form";

export default async function NewContentPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">New content</h1>
      <ContentEditorForm categories={categories} />
    </div>
  );
}
