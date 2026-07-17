import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { content: true } } },
  });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Categories</h1>
      <CategoryManager
        initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c._count.content,
        }))}
      />
    </div>
  );
}
