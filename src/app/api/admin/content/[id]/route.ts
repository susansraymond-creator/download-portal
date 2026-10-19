import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";
import { contentSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { id } = await params;
  const content = await prisma.content.findUnique({
    where: { id },
    include: { downloadLinks: { orderBy: { sortOrder: "asc" } }, tags: true, category: true },
  });

  if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ content });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { id } = await params;
  const parsed = contentSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.content.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await prisma.content.findUnique({ where: { slug: data.slug } });
    if (slugTaken) return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }

  // Download links: full replace-on-edit keeps this endpoint simple and
  // avoids partial-update ordering bugs. For high-churn catalogs this could
  // be swapped for per-link PATCH endpoints (already scaffolded pattern).
  await prisma.contentChange.create({
    data: {
      contentId: id,
      title: data.title ?? existing.title,
      data: parsed.data as object,
      requestedBy: session!.user.id,
      requestedByName: session!.user.name ?? session!.user.email ?? "Unknown",
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CONTENT_CHANGE_REQUESTED",
    entity: "Content",
    entityId: id,
    ipAddress: getClientIp(req.headers),
  });

return NextResponse.json({
    ok: true,
    pending: true,
    message: "Saved as a pending change. Accept it on the Updates page to publish.",
  });

}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;

  const { id } = await params;

  await prisma.content.delete({ where: { id } }).catch(() => null);

  await logAudit({
    userId: session!.user.id,
    action: "CONTENT_DELETED",
    entity: "Content",
    entityId: id,
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}

