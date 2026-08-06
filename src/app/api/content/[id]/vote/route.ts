import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const voteSchema = z.object({
  voteType: z.enum(["MUST_WATCH", "GOOD", "AVERAGE"]),
});

const VOTER_COOKIE = "voter_id";

async function getVoterKey() {
  const cookieStore = await cookies();
  let voterId = cookieStore.get(VOTER_COOKIE)?.value;
  if (!voterId) {
    voterId = randomUUID();
    cookieStore.set(VOTER_COOKIE, voterId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
    });
  }
  return voterId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const voterId = cookieStore.get(VOTER_COOKIE)?.value;

  const [counts, myVote] = await Promise.all([
    prisma.contentVote.groupBy({
      by: ["voteType"],
      where: { contentId: id },
      _count: true,
    }),
    voterId
      ? prisma.contentVote.findUnique({
          where: { contentId_voterKey: { contentId: id, voterKey: voterId } },
        })
      : null,
  ]);

  const tally = { MUST_WATCH: 0, GOOD: 0, AVERAGE: 0 };
  for (const c of counts) {
    tally[c.voteType as keyof typeof tally] = c._count;
  }
  const total = tally.MUST_WATCH + tally.GOOD + tally.AVERAGE;

  return NextResponse.json({ tally, total, myVote: myVote?.voteType ?? null });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = voteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid vote" }, { status: 400 });

  const voterKey = await getVoterKey();

  await prisma.contentVote.upsert({
    where: { contentId_voterKey: { contentId: id, voterKey } },
    create: { contentId: id, voterKey, voteType: parsed.data.voteType },
    update: { voteType: parsed.data.voteType },
  });

  const counts = await prisma.contentVote.groupBy({
    by: ["voteType"],
    where: { contentId: id },
    _count: true,
  });
  const tally = { MUST_WATCH: 0, GOOD: 0, AVERAGE: 0 };
  for (const c of counts) {
    tally[c.voteType as keyof typeof tally] = c._count;
  }
  const total = tally.MUST_WATCH + tally.GOOD + tally.AVERAGE;

  return NextResponse.json({ tally, total, myVote: parsed.data.voteType });
}