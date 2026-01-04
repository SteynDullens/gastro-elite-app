import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// Helper to find recipe in either table
async function findRecipe(recipeId: string) {
  return await safeDbOperation(async (prisma) => {
    // Try PersonalRecipe first
    const personalRecipe = await prisma.personalRecipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        userId: true,
        name: true,
        image: true,
        batchSize: true,
        servings: true,
        instructions: true,
        categories: { select: { id: true, name: true } },
        ingredients: { select: { id: true, quantity: true, unit: true, name: true } },
        createdAt: true
      }
    });

    if (personalRecipe) {
      return { ...personalRecipe, type: 'personal' as const, companyId: null, creatorId: null };
    }

    // Try CompanyRecipe
    const companyRecipe = await prisma.companyRecipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        companyId: true,
        creatorId: true,
        name: true,
        image: true,
        batchSize: true,
        servings: true,
        instructions: true,
        categories: { select: { id: true, name: true } },
        ingredients: { select: { id: true, quantity: true, unit: true, name: true } },
        createdAt: true
      }
    });

    if (companyRecipe) {
      return { ...companyRecipe, type: 'company' as const, userId: null, originalOwnerId: companyRecipe.creatorId };
    }

    // Fallback: Try old Recipe table (during migration)
    const oldRecipe = await (prisma as any).recipe?.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        userId: true,
        companyId: true,
        originalOwnerId: true,
        name: true,
        image: true,
        batchSize: true,
        servings: true,
        instructions: true,
        categories: { select: { id: true, name: true } },
        ingredients: { select: { id: true, quantity: true, unit: true, name: true } },
        createdAt: true
      }
    });

    if (oldRecipe) {
      const type = oldRecipe.companyId ? 'company' : 'personal';
      return { ...oldRecipe, type, creatorId: oldRecipe.originalOwnerId };
    }

    return null;
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params;
    console.log('🔒 Recipe update API called for:', recipeId);
    
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user with company memberships - try multiple query strategies (same as POST/DELETE endpoints)
    console.log('🔍 Looking up user for update:', decoded.id, 'Type:', typeof decoded.id);
    let user: any = null;
    let lookupError: any = null;
    
    // Strategy 1: Try with companyMemberships (new schema)
    try {
      const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
      if (prisma) {
        try {
          user = await prisma.user.findUnique({
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
        } catch (error: any) {
          lookupError = error;
          console.log('⚠️  Query with companyMemberships failed:', error.message, error.code);
        }
      }
    } catch (error: any) {
      lookupError = error;
      console.log('⚠️  Prisma import failed:', error.message);
    }
    
    // Strategy 2: If that failed, try with legacy company relation
    if (!user) {
      try {
        console.log('⚠️  Trying query with legacy company relation...');
        const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
        if (prisma) {
          try {
            user = await prisma.user.findUnique({
              where: { id: decoded.id },
              include: { 
                ownedCompany: true,
                company: true // Legacy relation
              }
            });
            // Set empty array for memberships if using legacy query
            if (user) {
              user.companyMemberships = [];
            }
          } catch (error: any) {
            lookupError = error;
            console.log('⚠️  Query with legacy company also failed:', error.message, error.code);
          }
        }
      } catch (error: any) {
        lookupError = error;
        console.log('⚠️  Prisma import failed in strategy 2:', error.message);
      }
    }
    
    // Strategy 3: Last resort - minimal query (most reliable)
    if (!user) {
      try {
        console.log('⚠️  Trying minimal query...');
        const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
        if (prisma) {
          try {
            user = await prisma.user.findUnique({
              where: { id: decoded.id },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isBlocked: true,
                companyId: true,
                ownedCompany: {
                  select: { id: true, name: true }
                }
              }
            });
            if (user) {
              user.companyMemberships = [];
              // Try to fetch memberships separately if user exists
              try {
                const memberships = await prisma.companyMembership.findMany({
                  where: { userId: decoded.id },
                  include: { company: true }
                });
                user.companyMemberships = memberships;
              } catch (e: any) {
                console.log('⚠️  Could not fetch memberships separately:', e.message);
              }
            }
          } catch (error: any) {
            lookupError = error;
            console.error('❌ Minimal query also failed:', error.message, error.code);
          }
        }
      } catch (error: any) {
        lookupError = error;
        console.error('❌ Prisma import failed in strategy 3:', error.message);
      }
    }

    console.log('🔍 User lookup result for update:', {
      found: !!user,
      userId: decoded.id,
      isBlocked: user?.isBlocked,
      hasOwnedCompany: !!user?.ownedCompany,
      legacyCompanyId: user?.companyId,
      membershipsCount: user?.companyMemberships?.length || 0
    });

    if (!user) {
      console.error('❌ User not found after all strategies:', decoded.id);
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Determine user role - check both new memberships and legacy companyId
    const isCompanyOwner = !!user.ownedCompany?.id;
    const ownedCompanyId = user.ownedCompany?.id;
    const employeeCompanyIds = (user.companyMemberships || []).map((m: any) => m.companyId);
    const hasLegacyCompanyId = !!user.companyId;
    const isEmployee = employeeCompanyIds.length > 0 || hasLegacyCompanyId;
    const isPersonalUser = !isCompanyOwner && !isEmployee;

    // Find recipe in either table
    const existingRecipe = await findRecipe(recipeId);

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // STRICT PERMISSION CHECKS
    let canEdit = false;
    
    if (existingRecipe.type === 'company') {
      // Company recipe: Only company owner OR employee who created it can edit
      const isRecipeCreator = existingRecipe.creatorId === user.id;
      const isCompanyOwnerOfRecipe = isCompanyOwner && ownedCompanyId === existingRecipe.companyId;
      // Check both active memberships and legacy companyId
      const companyIdsToCheck = employeeCompanyIds.length > 0 
        ? employeeCompanyIds 
        : (user.companyId ? [user.companyId] : []);
      const isEmployeeOfCompany = isEmployee && companyIdsToCheck.includes(existingRecipe.companyId!);
      canEdit = isCompanyOwnerOfRecipe || (isEmployeeOfCompany && isRecipeCreator);
      
      if (!canEdit) {
        return NextResponse.json({ 
          error: 'Je kunt alleen bedrijfsrecepten bewerken die je zelf hebt toegevoegd, of als je de bedrijfseigenaar bent' 
        }, { status: 403 });
      }
    } else if (existingRecipe.type === 'personal') {
      // Personal recipe: Only the owner can edit
      canEdit = existingRecipe.userId === user.id;
      if (!canEdit) {
        return NextResponse.json({ 
          error: 'Je kunt alleen je eigen persoonlijke recepten bewerken' 
        }, { status: 403 });
      }
    }

    const body = await request.json();
    const { name, image, batchAmount, batchUnit, ingredients, steps, categories } = body as {
      name: string;
      image?: string;
      batchAmount?: number;
      batchUnit?: 'stuks' | 'personen' | 'portie';
      ingredients: { quantity: number; unit: string; name: string }[];
      steps: string[];
      categories: string[];
    };

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
        set: [],
        connect: categoryRecords
          .filter((c) => Boolean(c && (c as any).id))
          .map((c) => ({ id: (c as any).id })),
      },
      ingredients: {
        deleteMany: {},
        create: ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit as any,
        })),
      },
    };

    // Update based on recipe type
    let updatedRecipe: any;

    if (existingRecipe.type === 'personal') {
      updatedRecipe = await safeDbOperation(async (prisma) => {
        return await prisma.personalRecipe.update({
          where: { id: recipeId },
          data: recipeData,
          include: { categories: true, ingredients: true },
        });
      });
      
      // Map to unified format
      updatedRecipe = {
        ...updatedRecipe,
        userId: updatedRecipe.userId,
        companyId: null,
        originalOwnerId: updatedRecipe.userId,
        isSharedWithBusiness: false,
      };
    } else if (existingRecipe.type === 'company') {
      updatedRecipe = await safeDbOperation(async (prisma) => {
        return await prisma.companyRecipe.update({
          where: { id: recipeId },
          data: recipeData,
          include: { categories: true, ingredients: true },
        });
      });
      
      // Map to unified format
      updatedRecipe = {
        ...updatedRecipe,
        userId: null,
        companyId: updatedRecipe.companyId,
        originalOwnerId: updatedRecipe.creatorId,
        isSharedWithBusiness: false,
      };
    }

    console.log('✅ Recipe update successful:', recipeId);
    return NextResponse.json({ recipe: updatedRecipe });
  } catch (error) {
    console.error('❌ Update recipe error:', error);
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params;
    console.log('🔒 Recipe delete API called for:', recipeId);
    
    // Debug: Log all cookies received
    const allCookies = request.cookies.getAll();
    console.log('🍪 Cookies received:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    
    // Authenticate user - try multiple ways to get the token
    let token = request.cookies.get('auth-token')?.value;
    
    // Fallback: try reading from headers (some setups use Authorization header)
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('✅ Token found in Authorization header');
      }
    }
    
    // Fallback: try reading from cookie string
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        token = cookies['auth-token'];
        if (token) {
          console.log('✅ Token found in cookie header string');
        }
      }
    }
    
    if (!token) {
      console.error('❌ No authentication token found. Available cookies:', allCookies.map(c => c.name));
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user with company memberships - try multiple query strategies (same as POST endpoint)
    console.log('🔍 Looking up user for delete:', decoded.id, 'Type:', typeof decoded.id);
    let user: any = null;
    let lookupError: any = null;
    
    // Strategy 1: Try with companyMemberships (new schema)
    try {
      const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
      if (prisma) {
        try {
          user = await prisma.user.findUnique({
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
        } catch (error: any) {
          lookupError = error;
          console.log('⚠️  Query with companyMemberships failed:', error.message, error.code);
        }
      }
    } catch (error: any) {
      lookupError = error;
      console.log('⚠️  Prisma import failed:', error.message);
    }
    
    // Strategy 2: If that failed, try with legacy company relation
    if (!user) {
      try {
        console.log('⚠️  Trying query with legacy company relation...');
        const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
        if (prisma) {
          try {
            user = await prisma.user.findUnique({
              where: { id: decoded.id },
              include: { 
                ownedCompany: true,
                company: true // Legacy relation
              }
            });
            // Set empty array for memberships if using legacy query
            if (user) {
              user.companyMemberships = [];
            }
          } catch (error: any) {
            lookupError = error;
            console.log('⚠️  Query with legacy company also failed:', error.message, error.code);
          }
        }
      } catch (error: any) {
        lookupError = error;
        console.log('⚠️  Prisma import failed in strategy 2:', error.message);
      }
    }
    
    // Strategy 3: Last resort - minimal query (most reliable)
    if (!user) {
      try {
        console.log('⚠️  Trying minimal query...');
        const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
        if (prisma) {
          try {
            user = await prisma.user.findUnique({
              where: { id: decoded.id },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isBlocked: true,
                companyId: true,
                ownedCompany: {
                  select: { id: true, name: true }
                }
              }
            });
            if (user) {
              user.companyMemberships = [];
              // Try to fetch memberships separately if user exists
              try {
                const memberships = await prisma.companyMembership.findMany({
                  where: { userId: decoded.id },
                  include: { company: true }
                });
                user.companyMemberships = memberships;
              } catch (e: any) {
                console.log('⚠️  Could not fetch memberships separately:', e.message);
              }
            }
          } catch (error: any) {
            lookupError = error;
            console.error('❌ Minimal query also failed:', error.message, error.code);
          }
        }
      } catch (error: any) {
        lookupError = error;
        console.error('❌ Prisma import failed in strategy 3:', error.message);
      }
    }

    console.log('🔍 User lookup result for delete:', {
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
      console.error('❌ User not found after all strategies:', decoded.id);
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Determine user role
    const isCompanyOwner = !!user.ownedCompany?.id;
    const ownedCompanyId = user.ownedCompany?.id;
    const employeeCompanyIds = (user.companyMemberships || []).map((m: any) => m.companyId);
    const isEmployee = employeeCompanyIds.length > 0;

    // Find recipe in either table
    const existingRecipe = await findRecipe(recipeId);

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // STRICT PERMISSION CHECKS
    let canDelete = false;
    
    if (existingRecipe.type === 'company') {
      // Company recipe: Only company owner OR employee who created it can delete
      const isRecipeCreator = existingRecipe.creatorId === user.id;
      const isCompanyOwnerOfRecipe = isCompanyOwner && ownedCompanyId === existingRecipe.companyId;
      const isEmployeeOfCompany = isEmployee && employeeCompanyIds.includes(existingRecipe.companyId!);
      canDelete = isCompanyOwnerOfRecipe || (isEmployeeOfCompany && isRecipeCreator);
      
      if (!canDelete) {
        return NextResponse.json({ 
          error: 'Je kunt alleen bedrijfsrecepten verwijderen die je zelf hebt toegevoegd, of als je de bedrijfseigenaar bent' 
        }, { status: 403 });
      }
    } else if (existingRecipe.type === 'personal') {
      // Personal recipe: Only the owner can delete
      canDelete = existingRecipe.userId === user.id;
      if (!canDelete) {
        return NextResponse.json({ 
          error: 'Je kunt alleen je eigen persoonlijke recepten verwijderen' 
        }, { status: 403 });
      }
    }

    // Delete from correct table - use direct Prisma calls for reliability
    try {
      const prisma = await import('@/lib/prisma').then(m => m.getPrisma());
      if (!prisma) {
        throw new Error('Prisma client not available');
      }

      if (existingRecipe.type === 'personal') {
        console.log('🗑️  Deleting personal recipe:', recipeId, 'Name:', existingRecipe.name);
        await prisma.personalRecipe.delete({ where: { id: recipeId } });
        console.log('✅ Personal recipe deleted successfully:', recipeId);
      } else if (existingRecipe.type === 'company') {
        console.log('🗑️  Deleting company recipe:', recipeId, 'Name:', existingRecipe.name);
        await prisma.companyRecipe.delete({ where: { id: recipeId } });
        console.log('✅ Company recipe deleted successfully:', recipeId);
      } else {
        throw new Error(`Unknown recipe type: ${existingRecipe.type}`);
      }

      return NextResponse.json({ 
        success: true,
        message: 'Recipe deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ Error deleting recipe:', error.message, error.code);
      return NextResponse.json({ 
        error: 'Failed to delete recipe',
        details: error.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Delete recipe error (outer catch):', error.message);
    return NextResponse.json({ 
      error: 'Failed to delete recipe',
      details: error.message 
    }, { status: 500 });
  }
}
