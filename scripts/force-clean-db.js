const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceCleanDatabase() {
  try {
    console.log('🔍 Force cleaning database...');
    
    // Get all users first
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log(`📊 Found ${users.length} users in database`);
    
    if (users.length === 0) {
      console.log('✅ Database is already clean');
      return;
    }
    
    // Delete all data in the correct order
    console.log('🗑️  Deleting all data...');
    
    // Delete recipes first
    const deletedRecipes = await prisma.recipe.deleteMany({});
    console.log(`✅ Deleted ${deletedRecipes.count} recipes`);
    
    // Delete business applications
    const deletedBusinessApps = await prisma.businessApplication.deleteMany({});
    console.log(`✅ Deleted ${deletedBusinessApps.count} business applications`);
    
    // Delete companies
    const deletedCompanies = await prisma.company.deleteMany({});
    console.log(`✅ Deleted ${deletedCompanies.count} companies`);
    
    // Delete users
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deletedUsers.count} users`);
    
    console.log('🎉 Database force cleaned successfully!');
    
    // Verify cleanup
    const remainingUsers = await prisma.user.count();
    console.log(`📊 Remaining users: ${remainingUsers}`);
    
  } catch (error) {
    console.error('❌ Error force cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceCleanDatabase();
