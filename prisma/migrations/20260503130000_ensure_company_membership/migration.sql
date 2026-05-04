-- Production databases may have skipped migration 20241209000000.
-- Idempotent: maakt CompanyMembership alleen aan als die nog ontbreekt.

CREATE TABLE IF NOT EXISTS "CompanyMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id")
);

-- Foreign keys (alleen als constraints nog niet bestaan)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CompanyMembership_userId_fkey'
  ) THEN
    ALTER TABLE "CompanyMembership"
      ADD CONSTRAINT "CompanyMembership_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CompanyMembership_companyId_fkey'
  ) THEN
    ALTER TABLE "CompanyMembership"
      ADD CONSTRAINT "CompanyMembership_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "Company"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "CompanyMembership_userId_companyId_key"
  ON "CompanyMembership"("userId", "companyId");
CREATE INDEX IF NOT EXISTS "CompanyMembership_userId_idx"
  ON "CompanyMembership"("userId");
CREATE INDEX IF NOT EXISTS "CompanyMembership_companyId_idx"
  ON "CompanyMembership"("companyId");
