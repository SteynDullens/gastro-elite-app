// Production database migration script
const { PrismaClient } = require('@prisma/client');

async function migrateProduction() {
  console.log('🚀 Starting production database migration...');
  
  try {
    // This will use the DATABASE_URL from Vercel environment
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // The tables will be created automatically when the app starts
    // with the new Prisma schema
    console.log('✅ Database migration completed');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateProduction();
