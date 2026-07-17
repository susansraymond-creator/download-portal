import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-guard";

const tagSchema = z.object({ name: z.string().min(1).max(50) });

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ tags });
}

export async function POST(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const parsed = tagSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const slug = slugify(parsed.data.name, { lower: true, strict: true });

  const tag = await prisma.tag.upsert({
    where: { slug },
    create: { name: parsed.data.name, slug },
    update: {},
  });

  return NextResponse.json({ ok: true, tag });
}
