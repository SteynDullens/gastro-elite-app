import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// POST - Create recipe with STRICT multi-tenant isolation
export async function POST(request: NextRequest) {
  try {
    console.log('🔒 Recipe creation API called');
    
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      console.error('❌ No auth token found');
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('❌ Token verification failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('✅ Token decoded successfully:', {
      id: decoded.id,
      email: decoded.email,
      account_type: decoded.account_type
    });

    // Get user with company memberships - try multiple query strategies
    console.log('🔍 Looking up user in database:', decoded.id, 'Type:', typeof decoded.id);
    let user: any = null;
    let lookupError: any = null;
    
    // Strategy 1: Try with companyMemberships (new schema)
    try {
      user = await safeDbOperation(async (prisma) => {
        return await prisma.user.findUnique({
          where: { id: decoded.id },
          include: { 
            ownedCompany: true,
            companyMemberships: {
              include: {
                company: true
              }
            }
          }
        });
      });
    } catch (error: any) {
      lookupError = error;
      console.log('⚠️  Query with companyMemberships failed:', error.message);
    }
    
    // Strategy 2: If that failed, try with legacy company relation
    if (!user) {
      try {
        console.log('⚠️  Trying query with legacy company relation...');
        user = await safeDbOperation(async (prisma) => {
          return await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { 
              ownedCompany: true,
              company: true // Legacy relation
            }
          });
        });
        // Set empty array for memberships if using legacy query
        if (user) {
          user.companyMemberships = [];
        }
      } catch (error: any) {
        lookupError = error;
        console.log('⚠️  Query with legacy company also failed:', error.message);
      }
    }
    
    // Strategy 3: Last resort - minimal query
    if (!user) {
      try {
        console.log('⚠️  Trying minimal query...');
        user = await safeDbOperation(async (prisma) => {
          return await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
              id: true,
              email: true,
              isBlocked: true,
              companyId: true,
              ownedCompany: {
                select: { id: true }
              }
            }
          });
        });
        if (user) {
          user.companyMemberships = [];
        }
      } catch (error: any) {
        lookupError = error;
        console.error('❌ All query strategies failed:', error.message);
      }
    }

    console.log('🔍 User lookup result:', {
      found: !!user,
      userId: decoded.id,
      userIdType: typeof decoded.id,
      userEmail: user?.email,
      userDbId: user?.id,
      userDbIdType: typeof user?.id,
      isBlocked: user?.isBlocked,
      hasOwnedCompany: !!user?.ownedCompany,
      legacyCompanyId: user?.companyId,
      membershipsCount: user?.companyMemberships?.length || 0,
      error: lookupError?.message,
      errorCode: lookupError?.code
    });

    if (!user) {
      console.error('❌ User not found after all query strategies:', {
        searchedId: decoded.id,
        searchedIdType: typeof decoded.id,
        error: lookupError?.message,
        errorCode: lookupError?.code
      });
      
      // Try one more direct query by email to see if user exists
      try {
        const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
        if (prisma && decoded.email) {
          const directCheck = await prisma.user.findFirst({
            where: { email: decoded.email },
            select: { id: true, email: true }
          });
          console.log('🔍 Direct email lookup result:', directCheck);
          if (directCheck && directCheck.id !== decoded.id) {
            console.error('⚠️  ID mismatch! Token ID:', decoded.id, 'DB ID:', directCheck.id);
          }
        }
      } catch (e: any) {
        console.error('❌ Direct email lookup also failed:', e.message);
      }
      
      return NextResponse.json({ 
        error: 'User not found or inactive',
        details: lookupError?.message || 'User query returned null after all fallback strategies'
      }, { status: 401 });
    }

    if (user.isBlocked) {
      console.error('❌ User is blocked:', decoded.id);
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Determine user role (check both new companyMemberships and legacy companyId)
    const isCompanyOwner = !!user.ownedCompany?.id;
    const hasCompanyMemberships = user.companyMemberships && user.companyMemberships.length > 0;
    const hasLegacyCompanyId = !!user.companyId;
    const isEmployee = hasCompanyMemberships || hasLegacyCompanyId;
    const isPersonalUser = !isCompanyOwner && !isEmployee;

    const body = await request.json();
    const { name, image, batchAmount, batchUnit, ingredients, steps, categories, saveTo: initialSaveTo } = body as {
      name: string;
      image?: string;
      batchAmount?: number;
      batchUnit?: 'stuks' | 'personen' | 'portie';
      ingredients: { quantity: number; unit: string; name: string }[];
      steps: string[];
      categories: string[]; // names
      saveTo?: 'personal' | 'business' | 'both';
    };
    
    // Enforce role-based saveTo rules
    let saveTo = initialSaveTo;
    if (isCompanyOwner) {
      // Company owners ALWAYS save to company - no choice
      saveTo = 'business';
      console.log('🔒 Company owner: Forcing saveTo to business');
    } else if (isPersonalUser) {
      // Personal users ALWAYS save to personal - no choice
      saveTo = 'personal';
      console.log('🔒 Personal user: Forcing saveTo to personal');
    } else if (isEmployee) {
      // Employees can choose, but validate
      if (!saveTo || (saveTo !== 'personal' && saveTo !== 'business' && saveTo !== 'both')) {
        saveTo = 'personal'; // Default to personal
      }
      console.log('✅ Employee: Using chosen saveTo:', saveTo);
    }

    if (!name || !Array.isArray(ingredients) || !Array.isArray(steps)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Ensure categories exist
    const categoryRecords = await safeDbOperation(async (prisma) => {
      return await Promise.all(
        (categories || []).map(async (catName) => {
          const trimmed = (catName || '').trim();
          if (!trimmed) return null;
          const existing = await prisma.category.findFirst({ where: { name: { equals: trimmed } } });
          if (existing) return existing;
          return prisma.category.create({ data: { name: trimmed } });
        })
      );
    }) || [];

    // Build recipe data
    const recipeData = {
      name,
      image,
      batchSize: batchAmount || null,
      servings: batchUnit === 'personen' ? (batchAmount || null) : null,
      instructions: steps
        .map((s: string, i: number) => (s && s.trim() ? `${i + 1}. ${s.trim()}` : ''))
        .filter(Boolean)
        .join('\n'),
      categories: {
        connect: categoryRecords
          .filter((c) => Boolean(c && (c as any).id))
          .map((c) => ({ id: (c as any).id })),
      },
    };

    let recipe;
    
    if (saveTo === 'both') {
      // Create TWO completely separate recipes: one in PersonalRecipe, one in CompanyRecipe
      console.log('🔒 Creating both personal and company recipes for employee:', user.id);
      
      // Get company ID from memberships or legacy companyId
      let companyId: string | null = null;
      if (user.companyMemberships && user.companyMemberships.length > 0) {
        companyId = user.companyMemberships[0].companyId;
      } else if (user.companyId) {
        // Fallback to legacy companyId
        companyId = user.companyId;
      }
      
      if (!companyId) {
        return NextResponse.json({ error: 'Employee must be linked to a company to save to both' }, { status: 400 });
      }

      const [personalRecipe, companyRecipe] = await Promise.all([
        // Create PersonalRecipe - completely separate table
        safeDbOperation(async (prisma) => {
          return await prisma.personalRecipe.create({
            data: {
              ...recipeData,
              userId: user.id, // REQUIRED for personal recipes
              ingredients: {
                create: ingredients.map((ing) => ({
                  name: ing.name,
                  quantity: ing.quantity,
                  unit: ing.unit as any,
                })),
              },
            },
            include: { categories: true, ingredients: true },
          });
        }),
        // Create CompanyRecipe - completely separate table
        safeDbOperation(async (prisma) => {
          return await prisma.companyRecipe.create({
            data: {
              ...recipeData,
              companyId: companyId, // REQUIRED for company recipes
              creatorId: user.id, // Track creator, but company owns it
              ingredients: {
                create: ingredients.map((ing) => ({
                  name: ing.name,
                  quantity: ing.quantity,
                  unit: ing.unit as any,
                })),
              },
            },
            include: { categories: true, ingredients: true },
          });
        })
      ]);
      
      console.log('✅ Both recipes creation result:', {
        personalRecipeId: personalRecipe?.id,
        companyRecipeId: companyRecipe?.id,
        personalSuccess: !!personalRecipe,
        companySuccess: !!companyRecipe
      });
      
      if (!personalRecipe) {
        console.error('❌ Failed to create personal recipe in "both" mode:', {
          userId: user.id,
          companyId: companyId,
          error: 'Personal recipe creation returned null'
        });
        return NextResponse.json({ 
          error: 'Failed to create personal recipe',
          details: 'Personal recipe creation returned null'
        }, { status: 500 });
      }
      
      // Return the personal recipe (employee owns this one)
      return NextResponse.json({ 
        recipe: {
          ...personalRecipe,
          userId: personalRecipe.userId,
          companyId: null,
          originalOwnerId: personalRecipe.userId,
          isSharedWithBusiness: false,
        }
      });
      
    } else if (saveTo === 'personal') {
      // Create PersonalRecipe only
      console.log('🔒 Creating personal recipe for user:', user.id, 'Type:', typeof user.id);
      console.log('🔒 Recipe data:', {
        name,
        userId: user.id,
        ingredientsCount: ingredients.length,
        categoriesCount: categoryRecords.length
      });
      
      let createError: any = null;
      // Try direct Prisma call first to get better error messages
      try {
        const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
        if (!prisma) {
          throw new Error('Prisma client not available');
        }
        recipe = await prisma.personalRecipe.create({
            data: {
              ...recipeData,
              userId: user.id, // REQUIRED
              ingredients: {
                create: ingredients.map((ing) => ({
                  name: ing.name,
                  quantity: ing.quantity,
                  unit: ing.unit as any,
                })),
              },
            },
            include: { categories: true, ingredients: true },
          });
      } catch (error: any) {
        createError = error;
        console.error('❌ Error creating personal recipe:', {
          message: error.message,
          code: error.code,
          meta: error.meta,
          stack: error.stack?.substring(0, 500)
        });
        // Fallback to safeDbOperation
        recipe = await safeDbOperation(async (prisma) => {
          return await prisma.personalRecipe.create({
            data: {
              ...recipeData,
              userId: user.id,
              ingredients: {
                create: ingredients.map((ing) => ({
                  name: ing.name,
                  quantity: ing.quantity,
                  unit: ing.unit as any,
                })),
              },
            },
            include: { categories: true, ingredients: true },
          });
        });
      }
      
      console.log('✅ Personal recipe creation result:', {
        success: !!recipe,
        recipeId: recipe?.id,
        error: createError?.message
      });
      
      if (!recipe) {
        console.error('❌ Failed to create personal recipe:', {
          userId: user.id,
          userIdType: typeof user.id,
          error: createError?.message,
          errorCode: createError?.code,
          prismaMeta: createError?.meta
        });
        return NextResponse.json({ 
          error: 'Failed to create personal recipe',
          details: createError?.message || 'Recipe creation returned null'
        }, { status: 500 });
      }
      
      // Map to unified format
      return NextResponse.json({ 
        recipe: {
          ...recipe,
          userId: recipe.userId,
          companyId: null,
          originalOwnerId: recipe.userId,
          isSharedWithBusiness: false,
        }
      });
      
    } else if (saveTo === 'business') {
      // Create CompanyRecipe only
      // Get company ID from ownedCompany, memberships, or legacy companyId
      let companyId: string | null = null;
      if (user.ownedCompany?.id) {
        companyId = user.ownedCompany.id;
      } else if (user.companyMemberships && user.companyMemberships.length > 0) {
        companyId = user.companyMemberships[0].companyId;
      } else if (user.companyId) {
        // Fallback to legacy companyId
        companyId = user.companyId;
      }
      if (!companyId) {
        return NextResponse.json({ error: 'User must be associated with a company to create business recipes' }, { status: 400 });
      }
      
      console.log('🔒 Creating business recipe for company:', companyId);
      recipe = await safeDbOperation(async (prisma) => {
        return await prisma.companyRecipe.create({
          data: {
            ...recipeData,
            companyId: companyId, // REQUIRED
            creatorId: user.id, // Track creator
            ingredients: {
              create: ingredients.map((ing) => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit as any,
              })),
            },
          },
          include: { categories: true, ingredients: true },
        });
      });
      console.log('✅ Business recipe created:', recipe?.id);
      
      if (!recipe) {
        return NextResponse.json({ error: 'Failed to create business recipe' }, { status: 500 });
      }
      
      // Map to unified format
      return NextResponse.json({ 
        recipe: {
          ...recipe,
          userId: null,
          companyId: recipe.companyId,
          originalOwnerId: recipe.creatorId,
          isSharedWithBusiness: false,
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid saveTo option' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Create recipe error:', error);
    console.error('Error details:', (error as any).message);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}
