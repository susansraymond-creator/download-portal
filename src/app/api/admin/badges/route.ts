import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/api-guard";

const schema = z.object({
  kind: z.enum(["QUALITY", "LANGUAGE"]),
  name: z.string().trim().min(1).max(40),
});

export async function POST(req: NextRequest) {
  const { response } = await requirePermission("MANAGE_CATEGORIES");
  if (response) return response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Multiple languages are stored comma-separated, so a name can't contain a comma.
  if (parsed.data.name.includes(",")) {
    return NextResponse.json({ error: "Name cannot contain a comma." }, { status: 400 });
  }

  const option = await prisma.badgeOption.upsert({
    where: { kind_name: { kind: parsed.data.kind, name: parsed.data.name } },
    create: { kind: parsed.data.kind, name: parsed.data.name },
    update: {},
  });

  return NextResponse.json({ ok: true, option });
}