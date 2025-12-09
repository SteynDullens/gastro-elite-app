// Fallback script: Check if EmployeeInvitation table exists, create if not
const { PrismaClient } = require('@prisma/client');

async function checkAndCreateTable() {
  const prisma = new PrismaClient();
  
  try {
    // Try to query the table - if it exists, this will work
    const count = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'EmployeeInvitation'
    `;
    
    const tableExists = count[0]?.count > 0;
    
    if (tableExists) {
      console.log('✅ EmployeeInvitation table already exists');
      return true;
    }
    
    console.log('📋 Creating EmployeeInvitation table...');
    
    // Create the table manually
    await prisma.$executeRaw`
      CREATE TABLE "EmployeeInvitation" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "companyId" TEXT NOT NULL,
        "invitedBy" TEXT,
        "invitedUserId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "EmployeeInvitation_pkey" PRIMARY KEY ("id")
      )
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX "EmployeeInvitation_companyId_idx" ON "EmployeeInvitation"("companyId")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX "EmployeeInvitation_email_idx" ON "EmployeeInvitation"("email")
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "EmployeeInvitation" 
      ADD CONSTRAINT "EmployeeInvitation_companyId_fkey" 
      FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "EmployeeInvitation" 
      ADD CONSTRAINT "EmployeeInvitation_invitedUserId_fkey" 
      FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `;
    
    // Mark the migration as applied
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        gen_random_uuid()::text,
        '',
        NOW(),
        '20241208000000_add_employee_invitation',
        NULL,
        NULL,
        NOW(),
        1
      )
      ON CONFLICT DO NOTHING
    `;
    
    console.log('✅ EmployeeInvitation table created successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If table already exists, that's okay
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log('ℹ️  Table already exists, marking migration as applied');
      return true;
    }
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateTable()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

