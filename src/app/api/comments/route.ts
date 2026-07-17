import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-guard";
import { commentSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { session, response } = await requireUser();
  if (response) return response;

  const { success } = await rateLimit(`comment:${session!.user.id}`, 20, 3600);
  if (!success) {
    return NextResponse.json({ error: "Too many comments submitted." }, { status: 429 });
  }

  const parsed = commentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      userId: session!.user.id,
      contentId: parsed.data.contentId,
      body: parsed.data.body,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, comment });
}
