import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

// GET - Fetch all recipes for the user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      // Return empty recipes instead of 401 to avoid console errors
      return NextResponse.json({ recipes: [] });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      // Return empty recipes instead of 401 to avoid console errors
      return NextResponse.json({ recipes: [] });
    }

    // Get user with company info to check companyId
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          companyId: true,
          ownedCompany: {
            select: { id: true }
          }
        }
      });
    });

    const companyId = user?.companyId || user?.ownedCompany?.id;
    const isCompanyOwner = !!user?.ownedCompany?.id;
    const isEmployee = !!user?.companyId && !user?.ownedCompany?.id;
    const isPersonalUser = !user?.companyId && !user?.ownedCompany?.id;

    const recipes = await safeDbOperation(async (prisma) => {
      // Build where clause based on user role:
      // - Company owners: ONLY business recipes (companyId matches AND userId is null)
      // - Employees: Personal recipes (userId matches AND companyId is null) + Business recipes (companyId matches AND userId is null)
      // - Personal users: ONLY personal recipes (userId matches AND companyId is null)
      let whereClause: any;
      
      if (isCompanyOwner) {
        // Company owners should ONLY see business recipes
        // Business recipes: companyId matches AND userId is null (strict requirement)
        whereClause = {
          companyId: companyId,
          userId: null
        };
        console.log('🔒 Company owner query:', JSON.stringify(whereClause, null, 2));
      } else if (isEmployee) {
        // Employees see their personal recipes AND business recipes
        whereClause = {
          OR: [
            // Personal recipes: owned by user and not linked to any company
            { 
              userId: decoded.id, 
              companyId: null 
            },
            // Business recipes: companyId matches AND userId is null (ensures it's a business recipe, not personal)
            { 
              companyId: companyId,
              userId: null
            }
          ]
        };
        console.log('👤 Employee query:', JSON.stringify(whereClause, null, 2));
      } else {
        // Personal users: ONLY personal recipes
        // Query for recipes where userId matches AND companyId is null
        whereClause = {
          userId: decoded.id,
          companyId: null
        };
        console.log('👤 Personal user query:', JSON.stringify(whereClause, null, 2));
      }

      const fetchedRecipes = await prisma.recipe.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          image: true,
          batchSize: true,
          servings: true,
          instructions: true,
          userId: true,
          companyId: true,
          originalOwnerId: true, // Include for edit permission checks
          isSharedWithBusiness: true,
          createdAt: true,
          categories: {
            select: {
              id: true,
              name: true
            }
          },
          ingredients: {
            select: {
              id: true,
              quantity: true,
              unit: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Additional safety filter: Remove any recipes that don't match the role requirements
      const filteredRecipes = fetchedRecipes.filter((recipe: any) => {
        if (isCompanyOwner) {
          // Company owners: ONLY recipes with companyId matching AND userId is null
          const isValid = recipe.companyId === companyId && recipe.userId === null;
          if (!isValid) {
            console.warn('🚫 Filtered out invalid recipe for company owner:', {
              id: recipe.id,
              name: recipe.name,
              userId: recipe.userId,
              companyId: recipe.companyId,
              expectedCompanyId: companyId
            });
          }
          return isValid;
        } else if (isEmployee) {
          // Employees: Personal recipes (userId matches AND companyId is null) OR business recipes (companyId matches AND userId is null)
          const isPersonal = recipe.userId === decoded.id && recipe.companyId === null;
          const isBusiness = recipe.companyId === companyId && recipe.userId === null;
          const isValid = isPersonal || isBusiness;
          if (!isValid) {
            console.warn('🚫 Filtered out invalid recipe for employee:', {
              id: recipe.id,
              name: recipe.name,
              userId: recipe.userId,
              companyId: recipe.companyId,
              expectedCompanyId: companyId,
              decodedId: decoded.id
            });
          }
          return isValid;
        } else {
          // Personal users: ONLY recipes with userId matching AND companyId is null
          const isValid = recipe.userId === decoded.id && recipe.companyId === null;
          if (!isValid) {
            console.warn('🚫 Filtered out invalid recipe for personal user:', {
              id: recipe.id,
              name: recipe.name,
              userId: recipe.userId,
              companyId: recipe.companyId,
              decodedId: decoded.id
            });
          }
          return isValid;
        }
      });

      console.log(`✅ Filtered recipes: ${filteredRecipes.length} out of ${fetchedRecipes.length} for user ${decoded.id} (${isCompanyOwner ? 'company owner' : isEmployee ? 'employee' : 'personal user'})`);
      
      return filteredRecipes;
    });

    // Deduplicate recipes: if "both" was selected, we have two recipes (one personal, one business)
    // Show only one in the frontend (prefer business version if user is employee/owner, otherwise personal)
    const deduplicatedRecipes = (recipes || []).reduce((acc: any[], recipe: any) => {
      // Only deduplicate recipes created by the current user (same originalOwnerId)
      if (recipe.originalOwnerId === decoded.id) {
        // Find if we already have a recipe with the same name and originalOwnerId
        const existing = acc.find(r => 
          r.name === recipe.name && 
          r.originalOwnerId === recipe.originalOwnerId &&
          r.originalOwnerId === decoded.id
        );
        
        if (existing) {
          // If we have both personal and business versions:
          // - For employees: prefer business version (they see it in business context)
          // - For company owners: prefer business version (they only see business)
          // - For personal users: prefer personal version (they don't have company)
          if (companyId && recipe.companyId && !existing.companyId) {
            // New recipe is business, existing is personal - replace with business
            const index = acc.indexOf(existing);
            acc[index] = recipe;
            return acc; // Don't add the recipe again
          }
          if (companyId && existing.companyId && !recipe.companyId) {
            // Existing is business, new is personal - keep business
            return acc; // Keep existing business version
          }
          // If both are same type, keep existing (don't add duplicate)
          return acc;
        }
      }
      
      // Add recipe if not a duplicate
      acc.push(recipe);
      return acc;
    }, []);

    return NextResponse.json({ recipes: deduplicatedRecipes });
  } catch (error: any) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
