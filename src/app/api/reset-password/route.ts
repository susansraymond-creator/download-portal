import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Reset link expired or invalid." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { id: record.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
