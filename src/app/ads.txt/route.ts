import { prisma } from "@/lib/prisma";

export async function GET() {
  const setting = await prisma.setting
    .findUnique({ where: { key: "googleAdsensePublisherId" } })
    .catch(() => null);
  const publisherId = setting?.value as string | undefined;

  const lines = publisherId
    ? [`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`]
    : [];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}