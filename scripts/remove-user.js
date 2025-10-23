const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeUser() {
  try {
    console.log('🔍 Looking for user: steyn@dullens.com');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'steyn@dullens.com' }
    });
    
    if (!user) {
      console.log('❌ User not found: steyn@dullens.com');
      return;
    }
    
    console.log('✅ Found user:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
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
    
    if (recipes.length > 0 || businessApplications.length > 0) {
      console.log('⚠️  User has related data. This will be deleted as well.');
      console.log('Do you want to continue? (This action cannot be undone)');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      
      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
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
    
    console.log('✅ User steyn@dullens.com has been successfully removed from the database');
    
  } catch (error) {
    console.error('❌ Error removing user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeUser();
