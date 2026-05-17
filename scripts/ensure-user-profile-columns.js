/**
 * Voegt ontbrekende User-kolommen toe (profiel, adres, notificaties, taal).
 */
const { PrismaClient } = require("@prisma/client");

const COLUMNS = [
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "postalCode" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "street" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT NOT NULL DEFAULT 'nl'`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushNotifications" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true`,
];

async function main() {
  console.log("🔍 Controleren User profielkolommen...");
  const prisma = new PrismaClient();
  try {
    for (const sql of COLUMNS) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log("✅ User profielkolommen zijn aanwezig");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
