import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

// GET - Fetch all recipes for the user with STRICT multi-tenant isolation
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ recipes: [] });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ recipes: [] });
    }

    // Get user with company memberships (many-to-many) - try multiple strategies
    let user: any = null;
    
    // Strategy 1: Try with companyMemberships
    try {
      user = await safeDbOperation(async (prisma) => {
        return await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            ownedCompany: {
              select: { id: true }
            },
            companyMemberships: {
              select: {
                companyId: true,
                company: {
                  select: { id: true }
                }
              }
            }
          }
        });
      });
    } catch (error: any) {
      console.log('⚠️  Query with companyMemberships failed, trying fallback...');
    }
    
    // Strategy 2: Fallback to legacy company relation
    if (!user) {
      try {
        user = await safeDbOperation(async (prisma) => {
          return await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
              id: true,
              ownedCompany: {
                select: { id: true }
              },
              companyId: true // Legacy field
            }
          });
        });
        if (user) {
          user.companyMemberships = [];
        }
      } catch (error: any) {
        console.log('⚠️  Fallback query also failed:', error.message);
      }
    }
    
    // Strategy 3: Minimal query
    if (!user) {
      try {
        user = await safeDbOperation(async (prisma) => {
          return await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
              id: true
            }
          });
        });
        if (user) {
          user.companyMemberships = [];
          user.ownedCompany = null;
        }
      } catch (error: any) {
        console.error('❌ All user lookup strategies failed:', error.message);
      }
    }

    if (!user) {
      console.log('⚠️  User not found, returning empty recipes');
      return NextResponse.json({ recipes: [] });
    }

    const isCompanyOwner = !!user.ownedCompany?.id;
    const ownedCompanyId = user.ownedCompany?.id;
    const employeeCompanyIds = (user.companyMemberships || []).map((m: any) => m.companyId);
    const hasLegacyCompanyId = !!user.companyId;
    const isEmployee = employeeCompanyIds.length > 0 || hasLegacyCompanyId;

    // STRICT BACKEND FILTERING - Multi-tenant isolation
    const result = await safeDbOperation(async (prisma) => {
      const personalRecipes: any[] = [];
      const companyRecipes: any[] = [];

      if (isCompanyOwner) {
        // Company owners: ONLY company recipes from their owned company
        // NO personal recipes access
        const recipes = await prisma.companyRecipe.findMany({
          where: {
            companyId: ownedCompanyId
          },
          select: {
            id: true,
            name: true,
            image: true,
            batchSize: true,
            servings: true,
            instructions: true,
            companyId: true,
            creatorId: true,
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

        // Map to unified format
        companyRecipes.push(...recipes.map(r => ({
          ...r,
          userId: null, // Company recipes never have userId
          originalOwnerId: r.creatorId,
          isSharedWithBusiness: false,
          type: 'company' as const
        })));

      } else if (isEmployee) {
        // Employees: Personal recipes (their own) + Company recipes (from companies they belong to)
        
        // Fetch personal recipes - STRICT: only recipes owned by this user
        const personal = await prisma.personalRecipe.findMany({
          where: {
            userId: decoded.id // STRICT: Only this user's recipes
          },
          select: {
            id: true,
            name: true,
            image: true,
            batchSize: true,
            servings: true,
            instructions: true,
            userId: true,
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

        personalRecipes.push(...personal.map(r => ({
          ...r,
          companyId: null, // Personal recipes never have companyId
          originalOwnerId: r.userId,
          isSharedWithBusiness: false,
          type: 'personal' as const
        })));

        // Fetch company recipes - STRICT: only from companies user belongs to
        const companyIdsToQuery = employeeCompanyIds.length > 0 
          ? employeeCompanyIds 
          : (user.companyId ? [user.companyId] : []);
        
        const company = companyIdsToQuery.length > 0 ? await prisma.companyRecipe.findMany({
          where: {
            companyId: { in: companyIdsToQuery } // STRICT: Only companies user belongs to
          },
          select: {
            id: true,
            name: true,
            image: true,
            batchSize: true,
            servings: true,
            instructions: true,
            companyId: true,
            creatorId: true,
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
        }) : [];

        companyRecipes.push(...company.map(r => ({
          ...r,
          userId: null, // Company recipes never have userId
          originalOwnerId: r.creatorId,
          isSharedWithBusiness: false,
          type: 'company' as const
        })));

      } else {
        // Personal users: ONLY personal recipes
        const personal = await prisma.personalRecipe.findMany({
          where: {
            userId: decoded.id // STRICT: Only this user's recipes
          },
          select: {
            id: true,
            name: true,
            image: true,
            batchSize: true,
            servings: true,
            instructions: true,
            userId: true,
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

        personalRecipes.push(...personal.map(r => ({
          ...r,
          companyId: null,
          originalOwnerId: r.userId,
          isSharedWithBusiness: false,
          type: 'personal' as const
        })));
      }

      // Combine and deduplicate if "both" was selected
      const allRecipes = [...personalRecipes, ...companyRecipes];
      
      // Deduplicate: if employee selected "both", they have two separate recipes
      // Show only one (prefer company version for employees/owners)
      const deduplicated = allRecipes.reduce((acc: any[], recipe: any) => {
        if (recipe.originalOwnerId === decoded.id) {
          const existing = acc.find(r => 
            r.name === recipe.name && 
            r.originalOwnerId === recipe.originalOwnerId
          );
          
          if (existing) {
            // Prefer company version if available
            if (recipe.type === 'company' && existing.type === 'personal') {
              const index = acc.indexOf(existing);
              acc[index] = recipe;
              return acc;
            }
            if (recipe.type === 'personal' && existing.type === 'company') {
              return acc; // Keep company version
            }
            return acc; // Same type, keep existing
          }
        }
        
        acc.push(recipe);
        return acc;
      }, []);

      return deduplicated;
    });

    console.log(`✅ Fetched ${result?.length || 0} recipes for user ${decoded.id} (${isCompanyOwner ? 'owner' : employeeCompanyIds.length > 0 ? 'employee' : 'personal'})`);

    return NextResponse.json({ recipes: result || [] });
  } catch (error: any) {
    console.error('❌ Error fetching recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
