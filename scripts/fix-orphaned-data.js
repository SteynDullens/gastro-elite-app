const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOrphanedData() {
  try {
    console.log('🔍 Checking for orphaned data...');

    // Check for orphaned CompanyIngredient records
    const allIngredients = await prisma.$queryRaw`
      SELECT id, "recipeId" FROM "CompanyIngredient"
    `;

    console.log(`Found ${allIngredients.length} CompanyIngredient records`);

    const orphanedIngredients = [];
    for (const ingredient of allIngredients) {
      const recipe = await prisma.$queryRaw`
        SELECT id FROM "CompanyRecipe" WHERE id = ${ingredient.recipeId}
      `;
      if (!recipe || recipe.length === 0) {
        orphanedIngredients.push(ingredient);
      }
    }

    if (orphanedIngredients.length > 0) {
      console.log(`⚠️ Found ${orphanedIngredients.length} orphaned CompanyIngredient records`);
      console.log('Deleting orphaned ingredients...');
      
      for (const ingredient of orphanedIngredients) {
        await prisma.$executeRaw`
          DELETE FROM "CompanyIngredient" WHERE id = ${ingredient.id}
        `;
        console.log(`Deleted orphaned ingredient: ${ingredient.id}`);
      }
    } else {
      console.log('✅ No orphaned data found');
    }

    console.log('✅ Orphaned data cleanup complete');
  } catch (error) {
    console.error('❌ Error fixing orphaned data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrphanedData();

