import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-guard";

const schema = z.object({ status: z.enum(["OPEN", "RESOLVED", "DISMISSED"]) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const report = await prisma.report.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true, report });
}
