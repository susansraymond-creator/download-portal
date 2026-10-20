import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requirePermission("MANAGE_CONTENT");
  if (response) return response;
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const tagIds = Array.isArray(body?.tagIds) && body.tagIds.every((value: unknown) => typeof value === "string") ? body.tagIds : null;
  if (!tagIds) return NextResponse.json({ error: "tagIds must be an array" }, { status: 400 });
  const content = await prisma.content.findUnique({ where: { id }, select: { title: true } });
  if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const validTags = await prisma.tag.count({ where: { id: { in: tagIds } } });
  if (validTags !== tagIds.length) return NextResponse.json({ error: "One or more tags are invalid" }, { status: 400 });
  const change = await prisma.contentChange.create({ data: { contentId: id, title: content.title, data: { tagIds }, requestedBy: session!.user.id, requestedByName: session!.user.name ?? session!.user.email ?? "Unknown" } });
  return NextResponse.json({ ok: true, pending: true, changeId: change.id });
}
