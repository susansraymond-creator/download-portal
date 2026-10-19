import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();

if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

const results = await prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      title: { contains: q, mode: "insensitive" },
    },
    take: 6,
    select: {
      id: true,
      slug: true,
      title: true,
      category: { select: { name: true } },
    },
  });

return NextResponse.json({ results });
}
