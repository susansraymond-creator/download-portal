import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Site Admin",
      passwordHash,
      role: "SUPER_ADMIN",
    },
    update: {},
  });

  console.log(`Seeded admin user: ${admin.email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`Default password: ${adminPassword} — change this immediately after first login.`);
  }

  const category = await prisma.category.upsert({
    where: { slug: "general" },
    create: { name: "General", slug: "general", description: "Uncategorized content" },
    update: {},
  });

  console.log(`Seeded category: ${category.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
