-- Abonnementen (Mollie)
CREATE TABLE IF NOT EXISTS "UserSubscription" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CompanySubscription" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanySubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BillingPayment" (
    "id" TEXT NOT NULL,
    "molliePaymentId" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "kind" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserSubscription_userId_key" ON "UserSubscription"("userId");
CREATE INDEX IF NOT EXISTS "UserSubscription_status_idx" ON "UserSubscription"("status");
CREATE INDEX IF NOT EXISTS "UserSubscription_mollieCustomerId_idx" ON "UserSubscription"("mollieCustomerId");

CREATE UNIQUE INDEX IF NOT EXISTS "CompanySubscription_companyId_key" ON "CompanySubscription"("companyId");
CREATE INDEX IF NOT EXISTS "CompanySubscription_status_idx" ON "CompanySubscription"("status");
CREATE INDEX IF NOT EXISTS "CompanySubscription_mollieCustomerId_idx" ON "CompanySubscription"("mollieCustomerId");

CREATE UNIQUE INDEX IF NOT EXISTS "BillingPayment_molliePaymentId_key" ON "BillingPayment"("molliePaymentId");
CREATE INDEX IF NOT EXISTS "BillingPayment_userId_idx" ON "BillingPayment"("userId");
CREATE INDEX IF NOT EXISTS "BillingPayment_companyId_idx" ON "BillingPayment"("companyId");
CREATE INDEX IF NOT EXISTS "BillingPayment_status_idx" ON "BillingPayment"("status");

DO $$ BEGIN
    ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
