import { prisma } from "@/lib/prisma";
import { TagManager } from "@/components/admin/tag-manager";

export default async function AdminTagsPage() {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Tags</h1>
      <TagManager initialTags={tags} />
    </div>
  );
}
