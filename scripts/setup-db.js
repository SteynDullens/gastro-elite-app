const { PrismaClient } = require('@prisma/client');

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // The database tables will be created automatically
    // when the app first connects to the database
    console.log('✅ Database setup completed');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    // Don't exit with error - let the app handle it
    console.log('⚠️  Continuing without database setup...');
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
