import { prisma } from "@/lib/prisma";

const DEFAULT_QUALITIES = [
  "WEB-DL",
  "WEBRip",
  "HDRip",
  "HDTC",
  "HDCAM",
  "BluRay",
  "DVDRip",
  "HDTV",
  "PreDVD",
];

const DEFAULT_LANGUAGES = [
  "Bangla",
  "English",
  "Hindi",
  "Hindi Dubbed",
  "Bangla Dubbed",
  "Dual Audio",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Kannada",
  "Korean",
  "Japanese",
  "Chinese",
  "Thai",
  "Turkish",
  "Spanish",
  "Indonesian",
  "Urdu",
  "Others",
];

// Adds the default options once, the first time they are needed. After that
// the admin fully controls the list from /admin/badges.
export async function getBadgeOptions() {
  const seeded = await prisma.setting.findUnique({ where: { key: "badgesSeeded" } });
  if (!seeded) {
    await prisma.badgeOption.createMany({
      data: [
        ...DEFAULT_QUALITIES.map((name) => ({ kind: "QUALITY" as const, name })),
        ...DEFAULT_LANGUAGES.map((name) => ({ kind: "LANGUAGE" as const, name })),
      ],
      skipDuplicates: true,
    });
    await prisma.setting.upsert({
      where: { key: "badgesSeeded" },
      create: { key: "badgesSeeded", value: true },
      update: {},
    });
  }

  const rows = await prisma.badgeOption.findMany({ orderBy: { name: "asc" } });
  return {
    qualities: rows.filter((r) => r.kind === "QUALITY"),
    languages: rows.filter((r) => r.kind === "LANGUAGE"),
  };
}