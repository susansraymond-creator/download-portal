import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-guard";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  siteName: z.string().max(80).optional(),
  siteDescription: z.string().max(300).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  googleAnalyticsId: z.string().max(30).optional().or(z.literal("")),
});

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const entries = Object.entries(parsed.data).filter(([, v]) => v !== undefined);

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: value as string },
        update: { value: value as string },
      })
    )
  );

  await logAudit({
    userId: session!.user.id,
    action: "SETTINGS_UPDATED",
    entity: "Setting",
    metadata: parsed.data,
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
