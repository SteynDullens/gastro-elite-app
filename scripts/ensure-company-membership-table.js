/**
 * Sommige productiedatabases hebben migratie 20241209 niet uitgevoerd;
 * CompanyMembership ontbreekt dan en Prisma faalt op include/findMany.
 */
const { PrismaClient } = require("@prisma/client");

async function ensureCompanyMembership() {
  console.log('🔍 Controleren of "CompanyMembership" bestaat...');
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1 FROM "CompanyMembership" LIMIT 1`;
    console.log('✅ CompanyMembership bestaat al');
    return;
  } catch {
    console.log('⚠️  CompanyMembership ontbreekt — aanmaken...');
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CompanyMembership" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "companyId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id")
      )
    `);

    const addFk = async (sql, name) => {
      try {
        await prisma.$executeRawUnsafe(sql);
        console.log(`✅ FK toegevoegd: ${name}`);
      } catch (e) {
        if (
          e.code === "42710" ||
          (e.message && e.message.includes("already exists"))
        ) {
          console.log(`ℹ️  FK ${name} bestond al`);
        } else {
          throw e;
        }
      }
    };

    await addFk(
      `
      ALTER TABLE "CompanyMembership"
      ADD CONSTRAINT "CompanyMembership_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `,
      "userId"
    );
    await addFk(
      `
      ALTER TABLE "CompanyMembership"
      ADD CONSTRAINT "CompanyMembership_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `,
      "companyId"
    );

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "CompanyMembership_userId_companyId_key"
      ON "CompanyMembership"("userId", "companyId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CompanyMembership_userId_idx" ON "CompanyMembership"("userId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CompanyMembership_companyId_idx" ON "CompanyMembership"("companyId")
    `);

    console.log('✅ CompanyMembership aangemaakt');
  } catch (e) {
    console.error('❌ CompanyMembership aanmaken mislukt:', e.message);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

ensureCompanyMembership().catch((err) => {
  console.error(err);
  process.exit(1);
});
