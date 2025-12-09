-- Migration script to create EmployeeInvitation table
-- Run this on your production database if migrations aren't working

CREATE TABLE IF NOT EXISTS "EmployeeInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "companyId" TEXT NOT NULL,
    "invitedBy" TEXT,
    "invitedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeInvitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmployeeInvitation_companyId_idx" ON "EmployeeInvitation"("companyId");
CREATE INDEX IF NOT EXISTS "EmployeeInvitation_email_idx" ON "EmployeeInvitation"("email");

-- Add foreign keys if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'EmployeeInvitation_companyId_fkey'
    ) THEN
        ALTER TABLE "EmployeeInvitation" 
        ADD CONSTRAINT "EmployeeInvitation_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'EmployeeInvitation_invitedUserId_fkey'
    ) THEN
        ALTER TABLE "EmployeeInvitation" 
        ADD CONSTRAINT "EmployeeInvitation_invitedUserId_fkey" 
        FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

