import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-guard";
import { reportSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { session, response } = await requireUser();
  if (response) return response;

  const { success } = await rateLimit(`report:${session!.user.id}`, 10, 3600);
  if (!success) {
    return NextResponse.json({ error: "Too many reports submitted." }, { status: 429 });
  }

  const parsed = reportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.report.create({
    data: {
      userId: session!.user.id,
      contentId: parsed.data.contentId,
      reason: parsed.data.reason,
      message: parsed.data.message,
    },
  });

  return NextResponse.json({ ok: true });
}
