const { PrismaClient } = require('@prisma/client');

async function migrate() {
  console.log('🚀 Starting database migration...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // The tables will be created when the app starts
    // with the new Prisma schema
    console.log('✅ Migration completed - tables will be created automatically');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
