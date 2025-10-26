const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseDatabase() {
  try {
    console.log('🔍 Diagnosing database state...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Total users: ${users.length}`);
    
    if (users.length > 0) {
      console.log('👥 Users in database:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.createdAt.toISOString()}`);
      });
    }
    
    // Check for test users specifically
    const testUsers = users.filter(user => 
      user.email.includes('test') || 
      user.email.includes('gastro-elite.com')
    );
    
    console.log(`🧪 Test users: ${testUsers.length}`);
    if (testUsers.length > 0) {
      console.log('Test users found:');
      testUsers.forEach(user => {
        console.log(`- ${user.email}`);
      });
    }
    
    // Check recipes
    const recipeCount = await prisma.recipe.count();
    console.log(`📝 Recipes: ${recipeCount}`);
    
    return {
      totalUsers: users.length,
      testUsers: testUsers.length,
      recipes: recipeCount,
      users: users
    };
    
  } catch (error) {
    console.error('❌ Database diagnosis failed:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseDatabase();
