/**
 * Migration script to move recipes from Recipe table to PersonalRecipe and CompanyRecipe tables
 * This script handles the transition to the new multi-tenant architecture
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateRecipes() {
  console.log('🚀 Starting recipe migration to separate tables...');
  
  try {
    // Step 1: Create CompanyMembership entries for existing user-company relationships
    console.log('📋 Step 1: Creating CompanyMembership entries...');
    const usersWithCompanies = await prisma.user.findMany({
      where: {
        companyId: { not: null }
      },
      select: {
        id: true,
        companyId: true
      }
    });

    for (const user of usersWithCompanies) {
      if (user.companyId) {
        try {
          await prisma.companyMembership.upsert({
            where: {
              userId_companyId: {
                userId: user.id,
                companyId: user.companyId
              }
            },
            create: {
              userId: user.id,
              companyId: user.companyId
            },
            update: {}
          });
          console.log(`✅ Created membership: User ${user.id} -> Company ${user.companyId}`);
        } catch (error) {
          console.error(`❌ Error creating membership for user ${user.id}:`, error.message);
        }
      }
    }

    // Step 2: Migrate personal recipes (userId is set, companyId is null)
    console.log('\n📋 Step 2: Migrating personal recipes...');
    const personalRecipes = await prisma.recipe.findMany({
      where: {
        userId: { not: null },
        companyId: null
      },
      include: {
        ingredients: true,
        categories: true
      }
    });

    console.log(`Found ${personalRecipes.length} personal recipes to migrate`);

    for (const recipe of personalRecipes) {
      if (!recipe.userId) continue;

      try {
        // Create PersonalRecipe
        const personalRecipe = await prisma.personalRecipe.create({
          data: {
            id: recipe.id,
            name: recipe.name,
            image: recipe.image,
            batchSize: recipe.batchSize,
            servings: recipe.servings,
            instructions: recipe.instructions,
            userId: recipe.userId,
            categories: {
              connect: recipe.categories.map(cat => ({ id: cat.id }))
            },
            ingredients: {
              create: recipe.ingredients.map(ing => ({
                quantity: ing.quantity,
                unit: ing.unit,
                name: ing.name
              }))
            },
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt
          }
        });
        console.log(`✅ Migrated personal recipe: ${recipe.name} (${recipe.id})`);
      } catch (error) {
        console.error(`❌ Error migrating personal recipe ${recipe.id}:`, error.message);
      }
    }

    // Step 3: Migrate company recipes (companyId is set, userId is null)
    console.log('\n📋 Step 3: Migrating company recipes...');
    const companyRecipes = await prisma.recipe.findMany({
      where: {
        companyId: { not: null },
        userId: null
      },
      include: {
        ingredients: true,
        categories: true
      }
    });

    console.log(`Found ${companyRecipes.length} company recipes to migrate`);

    for (const recipe of companyRecipes) {
      if (!recipe.companyId) continue;

      try {
        // Create CompanyRecipe
        const companyRecipe = await prisma.companyRecipe.create({
          data: {
            id: recipe.id,
            name: recipe.name,
            image: recipe.image,
            batchSize: recipe.batchSize,
            servings: recipe.servings,
            instructions: recipe.instructions,
            companyId: recipe.companyId,
            creatorId: recipe.originalOwnerId || null,
            categories: {
              connect: recipe.categories.map(cat => ({ id: cat.id }))
            },
            ingredients: {
              create: recipe.ingredients.map(ing => ({
                quantity: ing.quantity,
                unit: ing.unit,
                name: ing.name
              }))
            },
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt
          }
        });
        console.log(`✅ Migrated company recipe: ${recipe.name} (${recipe.id})`);
      } catch (error) {
        console.error(`❌ Error migrating company recipe ${recipe.id}:`, error.message);
      }
    }

    // Step 4: Handle "both" recipes (recipes with both userId and companyId - should be split)
    console.log('\n📋 Step 4: Handling recipes with both userId and companyId...');
    const bothRecipes = await prisma.recipe.findMany({
      where: {
        userId: { not: null },
        companyId: { not: null }
      },
      include: {
        ingredients: true,
        categories: true
      }
    });

    console.log(`Found ${bothRecipes.length} recipes with both userId and companyId`);

    for (const recipe of bothRecipes) {
      if (!recipe.userId || !recipe.companyId) continue;

      try {
        // Create PersonalRecipe
        await prisma.personalRecipe.create({
          data: {
            name: recipe.name,
            image: recipe.image,
            batchSize: recipe.batchSize,
            servings: recipe.servings,
            instructions: recipe.instructions,
            userId: recipe.userId,
            categories: {
              connect: recipe.categories.map(cat => ({ id: cat.id }))
            },
            ingredients: {
              create: recipe.ingredients.map(ing => ({
                quantity: ing.quantity,
                unit: ing.unit,
                name: ing.name
              }))
            },
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt
          }
        });

        // Create CompanyRecipe
        await prisma.companyRecipe.create({
          data: {
            name: recipe.name,
            image: recipe.image,
            batchSize: recipe.batchSize,
            servings: recipe.servings,
            instructions: recipe.instructions,
            companyId: recipe.companyId,
            creatorId: recipe.userId,
            categories: {
              connect: recipe.categories.map(cat => ({ id: cat.id }))
            },
            ingredients: {
              create: recipe.ingredients.map(ing => ({
                quantity: ing.quantity,
                unit: ing.unit,
                name: ing.name
              }))
            },
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt
          }
        });
        console.log(`✅ Split recipe into personal and company: ${recipe.name} (${recipe.id})`);
      } catch (error) {
        console.error(`❌ Error splitting recipe ${recipe.id}:`, error.message);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('⚠️  Note: Old Recipe table still exists. You can drop it after verifying the migration.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateRecipes()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });

