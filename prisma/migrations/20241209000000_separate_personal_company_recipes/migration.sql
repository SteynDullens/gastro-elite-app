-- Migration: Separate Personal and Company Recipes
-- This migration creates separate tables for personal and company recipes
-- to ensure strict multi-tenant isolation

-- Create CompanyMembership table (many-to-many user-company relationship)
CREATE TABLE IF NOT EXISTS "CompanyMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id")
);

-- Create PersonalRecipe table
CREATE TABLE IF NOT EXISTS "PersonalRecipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "batchSize" INTEGER,
    "servings" INTEGER,
    "instructions" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalRecipe_pkey" PRIMARY KEY ("id")
);

-- Create CompanyRecipe table
CREATE TABLE IF NOT EXISTS "CompanyRecipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "batchSize" INTEGER,
    "servings" INTEGER,
    "instructions" TEXT,
    "companyId" TEXT NOT NULL,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyRecipe_pkey" PRIMARY KEY ("id")
);

-- Create PersonalIngredient table
CREATE TABLE IF NOT EXISTS "PersonalIngredient" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "PersonalIngredient_pkey" PRIMARY KEY ("id")
);

-- Create CompanyIngredient table
CREATE TABLE IF NOT EXISTS "CompanyIngredient" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "CompanyIngredient_pkey" PRIMARY KEY ("id")
);

-- Create junction table for PersonalRecipe-Category
CREATE TABLE IF NOT EXISTS "_PersonalRecipeCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Create junction table for CompanyRecipe-Category
CREATE TABLE IF NOT EXISTS "_CompanyRecipeCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Add foreign keys
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyMembership" ADD CONSTRAINT "CompanyMembership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonalRecipe" ADD CONSTRAINT "PersonalRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyRecipe" ADD CONSTRAINT "CompanyRecipe_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyRecipe" ADD CONSTRAINT "CompanyRecipe_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PersonalIngredient" ADD CONSTRAINT "PersonalIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "PersonalRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyIngredient" ADD CONSTRAINT "CompanyIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "CompanyRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_PersonalRecipeCategories" ADD CONSTRAINT "_PersonalRecipeCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PersonalRecipeCategories" ADD CONSTRAINT "_PersonalRecipeCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "PersonalRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_CompanyRecipeCategories" ADD CONSTRAINT "_CompanyRecipeCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CompanyRecipeCategories" ADD CONSTRAINT "_CompanyRecipeCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "CompanyRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyMembership_userId_companyId_key" ON "CompanyMembership"("userId", "companyId");
CREATE INDEX IF NOT EXISTS "CompanyMembership_userId_idx" ON "CompanyMembership"("userId");
CREATE INDEX IF NOT EXISTS "CompanyMembership_companyId_idx" ON "CompanyMembership"("companyId");

CREATE INDEX IF NOT EXISTS "PersonalRecipe_userId_name_idx" ON "PersonalRecipe"("userId", "name");
CREATE INDEX IF NOT EXISTS "PersonalRecipe_userId_idx" ON "PersonalRecipe"("userId");

CREATE INDEX IF NOT EXISTS "CompanyRecipe_companyId_name_idx" ON "CompanyRecipe"("companyId", "name");
CREATE INDEX IF NOT EXISTS "CompanyRecipe_companyId_idx" ON "CompanyRecipe"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyRecipe_creatorId_idx" ON "CompanyRecipe"("creatorId");

CREATE INDEX IF NOT EXISTS "PersonalIngredient_recipeId_idx" ON "PersonalIngredient"("recipeId");
CREATE INDEX IF NOT EXISTS "CompanyIngredient_recipeId_idx" ON "CompanyIngredient"("recipeId");

CREATE UNIQUE INDEX IF NOT EXISTS "_PersonalRecipeCategories_AB_unique" ON "_PersonalRecipeCategories"("A", "B");
CREATE INDEX IF NOT EXISTS "_PersonalRecipeCategories_B_index" ON "_PersonalRecipeCategories"("B");

CREATE UNIQUE INDEX IF NOT EXISTS "_CompanyRecipeCategories_AB_unique" ON "_CompanyRecipeCategories"("A", "B");
CREATE INDEX IF NOT EXISTS "_CompanyRecipeCategories_B_index" ON "_CompanyRecipeCategories"("B");

