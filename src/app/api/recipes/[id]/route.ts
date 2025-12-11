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

    // Get user with company memberships
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { 
          ownedCompany: true,
          companyMemberships: {
            include: { company: true }
          }
        }
      });
    });

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Determine user role
    const isCompanyOwner = !!user.ownedCompany?.id;
    const ownedCompanyId = user.ownedCompany?.id;
    const employeeCompanyIds = user.companyMemberships.map(m => m.companyId);
    const isEmployee = employeeCompanyIds.length > 0;
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
      const isEmployeeOfCompany = isEmployee && employeeCompanyIds.includes(existingRecipe.companyId!);
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
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { 
          ownedCompany: true,
          companyMemberships: {
            include: { company: true }
          }
        }
      });
    });

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Determine user role
    const isCompanyOwner = !!user.ownedCompany?.id;
    const ownedCompanyId = user.ownedCompany?.id;
    const employeeCompanyIds = user.companyMemberships.map(m => m.companyId);
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

    // Delete from correct table
    if (existingRecipe.type === 'personal') {
      await safeDbOperation(async (prisma) => {
        await prisma.personalRecipe.delete({ where: { id: recipeId } });
      });
    } else if (existingRecipe.type === 'company') {
      await safeDbOperation(async (prisma) => {
        await prisma.companyRecipe.delete({ where: { id: recipeId } });
      });
    }

    console.log('✅ Recipe deleted successfully:', recipeId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Delete recipe error:', error);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}
