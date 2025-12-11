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
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user with company memberships
    console.log('🔍 Looking up user:', decoded.id);
    const user = await safeDbOperation(async (prisma) => {
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

    console.log('🔍 User lookup result:', {
      found: !!user,
      userId: decoded.id,
      userEmail: user?.email,
      isBlocked: user?.isBlocked,
      hasOwnedCompany: !!user?.ownedCompany,
      membershipsCount: user?.companyMemberships?.length || 0
    });

    if (!user) {
      console.error('❌ User not found:', decoded.id);
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    if (user.isBlocked) {
      console.error('❌ User is blocked:', decoded.id);
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Determine user role
    const isCompanyOwner = !!user.ownedCompany?.id;
    const isEmployee = user.companyMemberships.length > 0;
    const isPersonalUser = !user.ownedCompany && user.companyMemberships.length === 0;

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
      
      console.log('✅ Both recipes created - Personal:', personalRecipe?.id, 'Company:', companyRecipe?.id);
      
      if (!personalRecipe) {
        return NextResponse.json({ error: 'Failed to create personal recipe' }, { status: 500 });
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
      console.log('🔒 Creating personal recipe for user:', user.id);
      recipe = await safeDbOperation(async (prisma) => {
        return await prisma.personalRecipe.create({
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
      });
      console.log('✅ Personal recipe created:', recipe?.id);
      
      if (!recipe) {
        return NextResponse.json({ error: 'Failed to create personal recipe' }, { status: 500 });
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
      const companyId = user.ownedCompany?.id || user.companyMemberships[0]?.companyId;
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
