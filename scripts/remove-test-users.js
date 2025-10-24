const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeTestUsers() {
  try {
    console.log('🔍 Looking for test users...');
    
    // Find all test users
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'test1@gastro-elite.com',
            'test2@gastro-elite.com',
            'test3@gastro-elite.com',
            'test4@gastro-elite.com',
            'test5@gastro-elite.com',
            'test6@gastro-elite.com',
            'test7@gastro-elite.com',
            'test8@gastro-elite.com',
            'test9@gastro-elite.com',
            'test10@gastro-elite.com'
          ]
        }
      }
    });
    
    if (testUsers.length === 0) {
      console.log('❌ No test users found');
      return;
    }
    
    console.log(`✅ Found ${testUsers.length} test users:`);
    testUsers.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`);
    });
    
    // Check if users have any related data
    for (const user of testUsers) {
      const recipes = await prisma.recipe.findMany({
        where: { userId: user.id }
      });
      
      const businessApplications = await prisma.businessApplication.findMany({
        where: { userId: user.id }
      });
      
      if (recipes.length > 0 || businessApplications.length > 0) {
        console.log(`📊 User ${user.email} has related data:`);
        console.log(`- Recipes: ${recipes.length}`);
        console.log(`- Business applications: ${businessApplications.length}`);
      }
    }
    
    console.log('🗑️  Deleting test users and related data...');
    
    // Delete related data first
    for (const user of testUsers) {
      // Delete recipes
      await prisma.recipe.deleteMany({
        where: { userId: user.id }
      });
      
      // Delete business applications
      await prisma.businessApplication.deleteMany({
        where: { userId: user.id }
      });
    }
    
    // Delete the users
    const deleteResult = await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test1@gastro-elite.com',
            'test2@gastro-elite.com',
            'test3@gastro-elite.com',
            'test4@gastro-elite.com',
            'test5@gastro-elite.com',
            'test6@gastro-elite.com',
            'test7@gastro-elite.com',
            'test8@gastro-elite.com',
            'test9@gastro-elite.com',
            'test10@gastro-elite.com'
          ]
        }
      }
    });
    
    console.log(`✅ Successfully removed ${deleteResult.count} test users from the database`);
    
  } catch (error) {
    console.error('❌ Error removing test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeTestUsers();
