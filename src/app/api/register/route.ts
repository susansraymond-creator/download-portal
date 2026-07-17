import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  const { success } = await rateLimit(`register:${ip}`, 5, 3600);
  if (!success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Generic message avoids leaking which emails are registered.
    return NextResponse.json(
      { error: "Unable to create account with those details." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "USER" },
    select: { id: true, email: true },
  });

  await logAudit({
    userId: user.id,
    action: "USER_REGISTERED",
    entity: "User",
    entityId: user.id,
    ipAddress: ip,
  });

  return NextResponse.json({ ok: true });
}
