import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-guard";

const bodySchema = z.object({ contentId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const { session, response } = await requireUser();
  if (response) return response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.favorite.upsert({
    where: {
      userId_contentId: { userId: session!.user.id, contentId: parsed.data.contentId },
    },
    create: { userId: session!.user.id, contentId: parsed.data.contentId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireUser();
  if (response) return response;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.favorite
    .delete({
      where: {
        userId_contentId: { userId: session!.user.id, contentId: parsed.data.contentId },
      },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
