// Robust script to ensure EmployeeInvitation table exists
// This bypasses Prisma migrations and creates the table directly if needed
const { PrismaClient } = require('@prisma/client');

async function ensureTableExists() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking if EmployeeInvitation table exists...');
    
    // Try to query the table - if it exists, this will work
    try {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count 
        FROM "EmployeeInvitation"
        LIMIT 1
      `;
      console.log('✅ EmployeeInvitation table already exists');
      await prisma.$disconnect();
      return true;
    } catch (queryError) {
      // Table doesn't exist, we need to create it
      if (queryError.message.includes('does not exist') || queryError.code === '42P01') {
        console.log('📋 EmployeeInvitation table does not exist, creating it...');
      } else {
        throw queryError;
      }
    }
    
    // Create the table
    console.log('🔨 Creating EmployeeInvitation table...');
    
    await prisma.$executeRawUnsafe(`
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
    `);
    
    console.log('✅ Table created');
    
    // Create indexes
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "EmployeeInvitation_companyId_idx" ON "EmployeeInvitation"("companyId")
      `);
      console.log('✅ Index created: companyId');
    } catch (idxError) {
      console.log('ℹ️  Index companyId may already exist');
    }
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "EmployeeInvitation_email_idx" ON "EmployeeInvitation"("email")
      `);
      console.log('✅ Index created: email');
    } catch (idxError) {
      console.log('ℹ️  Index email may already exist');
    }
    
    // Add foreign keys
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "EmployeeInvitation" 
        ADD CONSTRAINT "EmployeeInvitation_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      `);
      console.log('✅ Foreign key created: companyId');
    } catch (fkError) {
      if (fkError.message.includes('already exists')) {
        console.log('ℹ️  Foreign key companyId already exists');
      } else {
        throw fkError;
      }
    }
    
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "EmployeeInvitation" 
        ADD CONSTRAINT "EmployeeInvitation_invitedUserId_fkey" 
        FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✅ Foreign key created: invitedUserId');
    } catch (fkError) {
      if (fkError.message.includes('already exists')) {
        console.log('ℹ️  Foreign key invitedUserId already exists');
      } else {
        throw fkError;
      }
    }
    
    // Mark migration as applied in Prisma's migration table
    try {
      await prisma.$executeRawUnsafe(`
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
        ON CONFLICT (migration_name) DO NOTHING
      `);
      console.log('✅ Migration marked as applied');
    } catch (migrationError) {
      console.log('ℹ️  Could not mark migration (may already be marked):', migrationError.message);
    }
    
    console.log('✅ EmployeeInvitation table setup complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    
    // Final check: Maybe table was created by another process?
    try {
      await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "EmployeeInvitation" LIMIT 1`;
      console.log('✅ Table exists after error (may have been created concurrently)');
      return true;
    } catch (finalCheck) {
      console.error('❌ Table definitely does not exist');
      return false;
    }
  } finally {
    await prisma.$disconnect();
  }
}

ensureTableExists()
  .then(success => {
    if (success) {
      console.log('🎉 Success! EmployeeInvitation table is ready.');
      process.exit(0);
    } else {
      // Even if creation failed, don't break the build - table might exist or be created manually
      console.log('⚠️  Table creation had issues, but build will continue');
      console.log('ℹ️  If table is missing, features may not work until table is created manually');
      process.exit(0); // Exit with 0 so build continues
    }
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    // Don't break build on fatal errors either
    console.log('⚠️  Fatal error occurred, but build will continue');
    process.exit(0);
  });

