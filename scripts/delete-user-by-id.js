require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUserById() {
  const userId = 'cmisr075b0000ji041aqoppjr';
  
  try {
    console.log(`🔍 Looking for user with ID: ${userId}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompany: true,
        company: true,
        recipes: true,
        originalRecipes: true
      }
    });
    
    if (!user) {
      console.log(`❌ User not found with ID: ${userId}`);
      return;
    }
    
    console.log('✅ Found user:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin
    });
    
    // Check related data
    console.log('\n📊 Related data found:');
    console.log('- Owned Company:', user.ownedCompany ? user.ownedCompany.name : 'None');
    console.log('- Employee of Company:', user.company ? user.company.name : 'None');
    console.log('- Recipes:', user.recipes.length);
    console.log('- Original Recipes:', user.originalRecipes.length);
    
    if (user.ownedCompany) {
      console.log('\n⚠️  WARNING: This user owns a company!');
      console.log('   Company:', user.ownedCompany.name);
      console.log('   Company ID:', user.ownedCompany.id);
      console.log('   This will also delete the company and all its data.');
    }
    
    if (user.recipes.length > 0 || user.originalRecipes.length > 0) {
      console.log('\n⚠️  WARNING: This user has recipes!');
      console.log('   These will be deleted as well.');
    }
    
    // Delete related data first
    console.log('\n🗑️  Starting deletion process...');
    
    // Delete recipes where user is the owner
    if (user.recipes.length > 0) {
      console.log('   Deleting user recipes...');
      await prisma.recipe.deleteMany({
        where: { userId: user.id }
      });
    }
    
    // Delete recipes where user is the original owner
    if (user.originalRecipes.length > 0) {
      console.log('   Deleting original recipes...');
      await prisma.recipe.updateMany({
        where: { originalOwnerId: user.id },
        data: { originalOwnerId: null }
      });
    }
    
    // Delete owned company (this will cascade delete company employees and company recipes)
    if (user.ownedCompany) {
      console.log('   Deleting owned company...');
      await prisma.company.delete({
        where: { id: user.ownedCompany.id }
      });
    }
    
    // Remove user from company employees list (if they're an employee)
    if (user.companyId) {
      console.log('   Removing user from company employees...');
      await prisma.user.update({
        where: { id: user.id },
        data: { companyId: null }
      });
    }
    
    // Finally, delete the user
    console.log('   Deleting user...');
    await prisma.user.delete({
      where: { id: userId }
    });
    
    console.log('\n✅ User successfully deleted!');
    
  } catch (error) {
    console.error('\n❌ Error deleting user:', error);
    if (error.code === 'P2003') {
      console.error('   Foreign key constraint error. There may be related data that needs to be deleted first.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

deleteUserById();

