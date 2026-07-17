import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-guard";
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
