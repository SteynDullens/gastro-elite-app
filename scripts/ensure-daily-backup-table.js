const { PrismaClient } = require("@prisma/client");

async function main() {
  console.log("🔍 Checking DailyBackup table...");
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1 FROM "DailyBackup" LIMIT 1`;
    console.log("✅ DailyBackup table already exists");
  } catch {
    console.log("⚠️ DailyBackup missing, creating...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DailyBackup" (
        "id" TEXT NOT NULL,
        "dateKey" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "blobUrl" TEXT NOT NULL,
        "pathname" TEXT NOT NULL,
        "sizeBytes" INTEGER NOT NULL,
        "backupType" TEXT NOT NULL DEFAULT 'all',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DailyBackup_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "DailyBackup_dateKey_key" ON "DailyBackup"("dateKey")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "DailyBackup_dateKey_idx" ON "DailyBackup"("dateKey")`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "DailyBackup_createdAt_idx" ON "DailyBackup"("createdAt")`
    );
    console.log("✅ DailyBackup table ready");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
