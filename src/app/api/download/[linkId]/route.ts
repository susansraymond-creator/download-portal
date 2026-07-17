import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { invalidateCache } from "@/lib/redis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;
  const ip = getClientIp(req.headers);

  // Throttle by IP to deter scraping/abuse of download endpoints.
  const { success } = await rateLimit(`download:${ip}`, 30, 60);
  if (!success) {
    return NextResponse.json(
      { error: "Too many download requests. Please slow down." },
      { status: 429 }
    );
  }

  const link = await prisma.downloadLink.findUnique({
    where: { id: linkId },
    include: { content: { select: { id: true, slug: true, status: true } } },
  });

  if (!link || link.content.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  if (link.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "This download link is currently unavailable." },
      { status: 410 }
    );
  }

  const session = await auth();

  await prisma.$transaction([
    prisma.downloadLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    }),
    prisma.content.update({
      where: { id: link.content.id },
      data: { downloadCount: { increment: 1 } },
    }),
    prisma.downloadEvent.create({
      data: {
        userId: session?.user?.id,
        contentId: link.content.id,
        downloadLinkId: link.id,
        ipAddress: ip,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    }),
  ]);

  await invalidateCache("content:popular:*");

  return NextResponse.redirect(link.url, { status: 302 });
}
