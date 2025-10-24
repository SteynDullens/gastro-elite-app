const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeSpecificUser() {
  try {
    console.log('🔍 Looking for user: test3@gastro-elite.com');
    
    // Find the specific user
    const user = await prisma.user.findUnique({
      where: { email: 'test3@gastro-elite.com' }
    });
    
    if (!user) {
      console.log('❌ User not found: test3@gastro-elite.com');
      console.log('🔍 Checking all users with "test" in email...');
      
      const testUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: 'test'
          }
        }
      });
      
      if (testUsers.length > 0) {
        console.log('✅ Found test users:');
        testUsers.forEach(u => console.log(`- ${u.email}`));
      } else {
        console.log('❌ No test users found');
      }
      return;
    }
    
    console.log('✅ Found user:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
    
    // Check if user has any related data
    const recipes = await prisma.recipe.findMany({
      where: { userId: user.id }
    });
    
    const businessApplications = await prisma.businessApplication.findMany({
      where: { userId: user.id }
    });
    
    console.log('📊 Related data found:');
    console.log('- Recipes:', recipes.length);
    console.log('- Business applications:', businessApplications.length);
    
    // Delete related data first
    if (recipes.length > 0) {
      console.log('🗑️  Deleting recipes...');
      await prisma.recipe.deleteMany({
        where: { userId: user.id }
      });
    }
    
    if (businessApplications.length > 0) {
      console.log('🗑️  Deleting business applications...');
      await prisma.businessApplication.deleteMany({
        where: { userId: user.id }
      });
    }
    
    // Delete the user
    console.log('🗑️  Deleting user...');
    await prisma.user.delete({
      where: { id: user.id }
    });
    
    console.log('✅ User test3@gastro-elite.com has been successfully removed from the database');
    
  } catch (error) {
    console.error('❌ Error removing user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeSpecificUser();
