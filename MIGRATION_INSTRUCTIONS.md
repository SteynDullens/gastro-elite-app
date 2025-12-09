# EmployeeInvitation Table Migration Instructions

The `EmployeeInvitation` table is missing from your production database. You need to run a migration to create it.

## Option 1: Automatic Migration (Recommended)

The migration will run automatically on your next Vercel deployment because we've added `prisma migrate deploy` to the build script.

**Just push this code and redeploy on Vercel.**

## Option 2: Manual Migration via Vercel CLI

1. Install Vercel CLI if you haven't: `npm i -g vercel`
2. Run: `vercel env pull` to get your environment variables
3. Run: `npx prisma migrate deploy`
4. This will create the EmployeeInvitation table

## Option 3: Manual SQL Execution

If you have direct database access, run the SQL from `scripts/create-employee-invitation-table.sql`:

```sql
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

-- Add foreign keys
ALTER TABLE "EmployeeInvitation" 
ADD CONSTRAINT "EmployeeInvitation_companyId_fkey" 
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EmployeeInvitation" 
ADD CONSTRAINT "EmployeeInvitation_invitedUserId_fkey" 
FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

## Verification

After running the migration, you should be able to:
- Send employee invitations (emails will be sent with Accept/Decline buttons)
- Delete employees/invitations properly
- See invitation statuses in the employees list

