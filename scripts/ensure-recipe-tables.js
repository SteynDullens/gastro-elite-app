const { PrismaClient } = require('@prisma/client');

async function ensureRecipeTables() {
  console.log('🔍 Checking if PersonalRecipe and CompanyRecipe tables exist...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test if PersonalRecipe table exists by trying to query it
    await prisma.$queryRaw`SELECT 1 FROM "PersonalRecipe" LIMIT 1`;
    console.log('✅ PersonalRecipe table exists');
  } catch (error) {
    console.log('⚠️  PersonalRecipe table does not exist, creating...');
    
    try {
      // Create PersonalRecipe table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PersonalRecipe" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "image" TEXT,
          "batchSize" INTEGER,
          "servings" INTEGER,
          "instructions" TEXT,
          "userId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `);
      
      // Add foreign key
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "PersonalRecipe" 
          ADD CONSTRAINT "PersonalRecipe_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        console.log('✅ Foreign key created: userId');
      } catch (fkError) {
        if (fkError.message.includes('already exists') || fkError.code === '42710') {
          console.log('ℹ️  Foreign key userId already exists');
        } else {
          throw fkError;
        }
      }
      
      // Create indexes
      try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PersonalRecipe_userId_name_idx" ON "PersonalRecipe"("userId", "name")`);
      } catch (e) {}
      try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PersonalRecipe_userId_idx" ON "PersonalRecipe"("userId")`);
      } catch (e) {}
      
      console.log('✅ PersonalRecipe table created successfully');
    } catch (createError) {
      console.error('❌ Failed to create PersonalRecipe table:', createError.message);
    }
  }
  
  try {
    // Test if CompanyRecipe table exists
    await prisma.$queryRaw`SELECT 1 FROM "CompanyRecipe" LIMIT 1`;
    console.log('✅ CompanyRecipe table exists');
  } catch (error) {
    console.log('⚠️  CompanyRecipe table does not exist, creating...');
    
    try {
      // Create CompanyRecipe table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "CompanyRecipe" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "image" TEXT,
          "batchSize" INTEGER,
          "servings" INTEGER,
          "instructions" TEXT,
          "companyId" TEXT NOT NULL,
          "creatorId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `);
      
      // Add foreign keys
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "CompanyRecipe" 
          ADD CONSTRAINT "CompanyRecipe_companyId_fkey" 
          FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        console.log('✅ Foreign key created: companyId');
      } catch (fkError) {
        if (fkError.message.includes('already exists') || fkError.code === '42710') {
          console.log('ℹ️  Foreign key companyId already exists');
        } else {
          throw fkError;
        }
      }
      
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "CompanyRecipe" 
          ADD CONSTRAINT "CompanyRecipe_creatorId_fkey" 
          FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
        `);
        console.log('✅ Foreign key created: creatorId');
      } catch (fkError) {
        if (fkError.message.includes('already exists') || fkError.code === '42710') {
          console.log('ℹ️  Foreign key creatorId already exists');
        } else {
          throw fkError;
        }
      }
      
      // Create indexes
      try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CompanyRecipe_companyId_name_idx" ON "CompanyRecipe"("companyId", "name")`);
      } catch (e) {}
      try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CompanyRecipe_companyId_idx" ON "CompanyRecipe"("companyId")`);
      } catch (e) {}
      try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CompanyRecipe_creatorId_idx" ON "CompanyRecipe"("creatorId")`);
      } catch (e) {}
      
      console.log('✅ CompanyRecipe table created successfully');
    } catch (createError) {
      console.error('❌ Failed to create CompanyRecipe table:', createError.message);
    }
  }
  
  try {
    // Test if PersonalIngredient table exists
    await prisma.$queryRaw`SELECT 1 FROM "PersonalIngredient" LIMIT 1`;
    console.log('✅ PersonalIngredient table exists');
  } catch (error) {
    console.log('⚠️  PersonalIngredient table does not exist, creating...');
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PersonalIngredient" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "quantity" DOUBLE PRECISION NOT NULL,
          "unit" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "recipeId" TEXT NOT NULL
        )
      `);
      
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "PersonalIngredient" 
          ADD CONSTRAINT "PersonalIngredient_recipeId_fkey" 
          FOREIGN KEY ("recipeId") REFERENCES "PersonalRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        console.log('✅ Foreign key created: PersonalIngredient.recipeId');
      } catch (fkError) {
        if (fkError.message.includes('already exists') || fkError.code === '42710') {
          console.log('ℹ️  Foreign key PersonalIngredient.recipeId already exists');
        } else {
          throw fkError;
        }
      }
      
      try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PersonalIngredient_recipeId_idx" ON "PersonalIngredient"("recipeId")`);
      } catch (e) {}
      
      console.log('✅ PersonalIngredient table created successfully');
    } catch (createError) {
      console.error('❌ Failed to create PersonalIngredient table:', createError.message);
    }
  }
  
  try {
    // Test if CompanyIngredient table exists
    await prisma.$queryRaw`SELECT 1 FROM "CompanyIngredient" LIMIT 1`;
    console.log('✅ CompanyIngredient table exists');
  } catch (error) {
    console.log('⚠️  CompanyIngredient table does not exist, creating...');
    
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "CompanyIngredient" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "quantity" DOUBLE PRECISION NOT NULL,
          "unit" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "recipeId" TEXT NOT NULL
        )
      `);
      
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "CompanyIngredient" 
          ADD CONSTRAINT "CompanyIngredient_recipeId_fkey" 
          FOREIGN KEY ("recipeId") REFERENCES "CompanyRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
        console.log('✅ Foreign key created: CompanyIngredient.recipeId');
      } catch (fkError) {
        if (fkError.message.includes('already exists') || fkError.code === '42710') {
          console.log('ℹ️  Foreign key CompanyIngredient.recipeId already exists');
        } else {
          throw fkError;
        }
      }
      
      try {
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CompanyIngredient_recipeId_idx" ON "CompanyIngredient"("recipeId")`);
      } catch (e) {}
      
      console.log('✅ CompanyIngredient table created successfully');
    } catch (createError) {
      console.error('❌ Failed to create CompanyIngredient table:', createError.message);
    }
  }
  
  // Create junction tables for categories
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_PersonalRecipeCategories" (
        "A" TEXT NOT NULL,
        "B" TEXT NOT NULL
      )
    `);
    
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "_PersonalRecipeCategories_AB_unique" ON "_PersonalRecipeCategories"("A", "B")`);
    } catch (e) {}
    
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "_PersonalRecipeCategories_B_index" ON "_PersonalRecipeCategories"("B")`);
    } catch (e) {}
    
    console.log('✅ _PersonalRecipeCategories junction table ready');
  } catch (error) {
    console.log('⚠️  Could not create _PersonalRecipeCategories:', error.message);
  }
  
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_CompanyRecipeCategories" (
        "A" TEXT NOT NULL,
        "B" TEXT NOT NULL
      )
    `);
    
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "_CompanyRecipeCategories_AB_unique" ON "_CompanyRecipeCategories"("A", "B")`);
    } catch (e) {}
    
    try {
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "_CompanyRecipeCategories_B_index" ON "_CompanyRecipeCategories"("B")`);
    } catch (e) {}
    
    console.log('✅ _CompanyRecipeCategories junction table ready');
  } catch (error) {
    console.log('⚠️  Could not create _CompanyRecipeCategories:', error.message);
  }
  
  await prisma.$disconnect();
  console.log('🎉 Success! Recipe tables are ready.');
}

ensureRecipeTables().catch((error) => {
  console.error('❌ Error ensuring recipe tables:', error);
  process.exit(1);
});

