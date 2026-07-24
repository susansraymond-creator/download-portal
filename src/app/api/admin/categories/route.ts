import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requirePermission } from "@/lib/api-guard";
import { invalidateCache } from "@/lib/redis";

const categorySchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  parentId: z.string().cuid().optional().nullable(),
  icon: z.string().max(50).optional(),
});

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { content: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const slug = slugify(parsed.data.name, { lower: true, strict: true });

  const category = await prisma.category.create({
    data: { ...parsed.data, slug },
  });

  await invalidateCache("categories:*");

  return NextResponse.json({ ok: true, category });
}

const patchSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(300).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  isHidden: z.boolean().optional(),
});
export async function PATCH(req: NextRequest) {
  const { response } = await requirePermission("MANAGE_CATEGORIES");
  if (response) return response;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { id, name, ...rest } = parsed.data;
  const slug = name ? slugify(name, { lower: true, strict: true }) : undefined;

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name !== undefined && { name, slug }),
      ...rest,
    },
  });
  await invalidateCache("categories:*");
  return NextResponse.json({ ok: true, category });
}