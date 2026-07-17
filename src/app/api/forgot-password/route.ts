import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// NOTE: actually emailing the reset link requires wiring up an email
// provider (Resend, SES, Postmark, etc). See README "Next steps" for the
// two lines that need to be un-stubbed once EMAIL_* env vars are set.

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const { success } = await rateLimit(`forgot-password:${ip}`, 5, 3600);
  if (!success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always return 200 regardless of whether the user exists, to avoid
  // leaking account existence via response timing/content.
  if (user) {
    const token = nanoid(48);
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes
      },
    });

    // TODO: send email with link `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] Password reset token for ${user.email}: ${token}`);
    }
  }

  return NextResponse.json({ ok: true });
}
