import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentEditorForm } from "@/components/admin/content-editor-form";

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [content, categories] = await Promise.all([
    prisma.content.findUnique({
      where: { id },
      include: { downloadLinks: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!content) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Edit content</h1>
      <ContentEditorForm
        contentId={content.id}
        categories={categories}
        initial={{
          title: content.title,
          slug: content.slug,
          description: content.description,
          shortDescription: content.shortDescription ?? "",
          type: content.type,
          status: content.status,
          posterUrl: content.posterUrl ?? "",
          thumbnailUrl: content.thumbnailUrl ?? "",
          categoryId: content.categoryId ?? "",
          isFeatured: content.isFeatured,
          publishAt: content.publishAt ? content.publishAt.toISOString().slice(0, 16) : "",
          metaTitle: content.metaTitle ?? "",
          metaDescription: content.metaDescription ?? "",
          downloadLinks: content.downloadLinks.map((l) => ({
            id: l.id,
            providerName: l.providerName,
            url: l.url,
            fileSize: l.fileSize ?? "",
            version: l.version ?? "",
            quality: l.quality ?? "",
            language: l.language ?? "",
            notes: l.notes ?? "",
            status: l.status,
          })),
        }}
      />
    </div>
  );
}
