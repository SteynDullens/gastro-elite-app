CREATE TABLE IF NOT EXISTS "SubscriptionInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "molliePaymentId" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "planType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountInclVat" TEXT NOT NULL,
    "amountExclVat" TEXT NOT NULL,
    "vatAmount" TEXT NOT NULL,
    "vatRatePercent" TEXT NOT NULL DEFAULT '21',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerAddress" TEXT,
    "buyerVatNumber" TEXT,
    "sellerSnapshot" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "pdfPathname" TEXT,
    "paymentMethod" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionInvoice_invoiceNumber_key" ON "SubscriptionInvoice"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionInvoice_molliePaymentId_key" ON "SubscriptionInvoice"("molliePaymentId");
CREATE INDEX IF NOT EXISTS "SubscriptionInvoice_userId_idx" ON "SubscriptionInvoice"("userId");
CREATE INDEX IF NOT EXISTS "SubscriptionInvoice_companyId_idx" ON "SubscriptionInvoice"("companyId");
CREATE INDEX IF NOT EXISTS "SubscriptionInvoice_issuedAt_idx" ON "SubscriptionInvoice"("issuedAt");
