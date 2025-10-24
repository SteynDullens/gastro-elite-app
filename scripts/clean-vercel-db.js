const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanVercelDatabase() {
  try {
    console.log('🔍 Cleaning Vercel database...');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log(`📊 Found ${users.length} users in database`);
    
    // Delete all users and related data
    console.log('🗑️  Deleting all users and related data...');
    
    // Delete recipes
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
    
    console.log('🎉 Vercel database cleaned successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanVercelDatabase();
