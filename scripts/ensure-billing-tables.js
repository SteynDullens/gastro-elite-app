/**
 * Maakt billing-tabellen aan indien ontbrekend.
 */
const { PrismaClient } = require("@prisma/client");

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'free',
    "mollieCustomerId" TEXT,
    "mollieSubscriptionId" TEXT,
    "waivedByCompanyId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "CompanySubscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "mollieCustomerId" TEXT,
    "mollieSubscriptionId" TEXT,
    "billedEmployeeCount" INTEGER NOT NULL DEFAULT 0,
    "monthlyAmount" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanySubscription_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "BillingPayment" (
    "id" TEXT NOT NULL,
    "molliePaymentId" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "kind" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "UserSubscription_userId_key" ON "UserSubscription"("userId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CompanySubscription_companyId_key" ON "CompanySubscription"("companyId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "BillingPayment_molliePaymentId_key" ON "BillingPayment"("molliePaymentId")`,
];

async function main() {
  console.log("🔍 Controleren billing-tabellen...");
  const prisma = new PrismaClient();
  try {
    for (const sql of STATEMENTS) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log("✅ Billing-tabellen zijn aanwezig");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
