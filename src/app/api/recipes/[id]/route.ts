import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params;
    console.log('Recipe update API called for:', recipeId);
    
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { ownedCompany: true, company: true }
      });
    });

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Determine user role
    const isCompanyOwner = !!user.ownedCompany?.id;
    const isEmployee = !!user.companyId && !user.ownedCompany?.id;
    const isPersonalUser = !user.companyId && !user.ownedCompany?.id;

    // Verify recipe exists and check permissions
    const existingRecipe = await safeDbOperation(async (prisma) => {
      return await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: {
          id: true,
          userId: true,
          companyId: true,
          originalOwnerId: true
        }
      });
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Permission rules:
    // - Company recipes: 
    //   * Company owner can edit all company recipes
    //   * Employee can edit business recipes they created (originalOwnerId matches)
    // - Personal recipes: Only the owner (userId matches) can edit
    const isCompanyRecipe = !!existingRecipe.companyId;
    const isPersonalRecipe = !!existingRecipe.userId && !existingRecipe.companyId;
    
    let canEdit = false;
    
    if (isCompanyRecipe) {
      // Company recipe: Company owner OR employee who created it can edit
      const isRecipeOwner = existingRecipe.originalOwnerId === user.id;
      const isCompanyOwnerOfRecipe = isCompanyOwner && user.ownedCompany?.id === existingRecipe.companyId;
      canEdit = isCompanyOwnerOfRecipe || (isEmployee && isRecipeOwner);
      
      if (!canEdit) {
        return NextResponse.json({ 
          error: 'Je kunt alleen bedrijfsrecepten bewerken die je zelf hebt toegevoegd, of als je de bedrijfseigenaar bent' 
        }, { status: 403 });
      }
    } else if (isPersonalRecipe) {
      // Personal recipe: Only the owner can edit
      canEdit = existingRecipe.userId === user.id;
      if (!canEdit) {
        return NextResponse.json({ 
          error: 'Je kunt alleen je eigen persoonlijke recepten bewerken' 
        }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid recipe state' }, { status: 400 });
    }

    const body = await request.json();
    console.log('Update request body:', JSON.stringify(body, null, 2));
    
    const { name, image, batchAmount, batchUnit, ingredients, steps, categories, saveTo: initialSaveTo } = body as {
      name: string;
      image?: string;
      batchAmount?: number;
      batchUnit?: 'stuks' | 'personen' | 'portie';
      ingredients: { quantity: number; unit: string; name: string }[];
      steps: string[];
      categories: string[]; // names
      saveTo: 'personal' | 'business' | 'both';
    };
    
    let saveTo = initialSaveTo;

    if (!name || !Array.isArray(ingredients) || !Array.isArray(steps)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Ensure categories exist (create if missing) and collect IDs
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
      ingredients: {
        deleteMany: {}, // Delete all existing ingredients
        create: ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit as any,
        })),
      },
      categories: {
        set: [], // Clear existing categories
        connect: categoryRecords
          .filter((c) => Boolean(c && (c as any).id))
          .map((c) => ({ id: (c as any).id })),
      },
    };

    // Enforce role-based saveTo rules (same as creation)
    if (isCompanyOwner) {
      // Company owners ALWAYS save to company
      saveTo = 'business';
    } else if (isPersonalUser) {
      // Personal users ALWAYS save to personal
      saveTo = 'personal';
    } else if (isEmployee) {
      // Employees can choose, but validate
      if (!saveTo || (saveTo !== 'personal' && saveTo !== 'business' && saveTo !== 'both')) {
        saveTo = isPersonalRecipe ? 'personal' : 'business';
      }
    }
    
    // Determine update data based on recipe type and saveTo
    const updateData: any = { ...recipeData };
    
    if (isCompanyRecipe) {
      // Editing company recipe: Keep it as company recipe (only owner can edit)
      updateData.companyId = existingRecipe.companyId;
      updateData.userId = null;
      updateData.isSharedWithBusiness = false;
    } else if (isPersonalRecipe) {
      // Editing personal recipe
      if (saveTo === 'both' && isEmployee) {
        // If employee wants to save to both, keep personal and create new company recipe
        updateData.userId = user.id;
        updateData.companyId = null;
        updateData.isSharedWithBusiness = false;
        
        // Create separate company recipe
        const companyId = user.companyId;
        if (companyId) {
          await safeDbOperation(async (prisma) => {
            await prisma.recipe.create({
              data: {
                ...recipeData,
                userId: null,
                companyId: companyId,
                originalOwnerId: user.id,
              },
              include: { categories: true, ingredients: true },
            });
          });
        }
      } else if (saveTo === 'business' && isEmployee) {
        // Convert personal to company recipe
        const companyId = user.companyId;
        if (!companyId) {
          return NextResponse.json({ error: 'Must be linked to company to convert to business recipe' }, { status: 400 });
        }
        updateData.companyId = companyId;
        updateData.userId = null;
        updateData.isSharedWithBusiness = false;
      } else {
        // Keep as personal
        updateData.userId = user.id;
        updateData.companyId = null;
        updateData.isSharedWithBusiness = false;
      }
    }

    const recipe = await safeDbOperation(async (prisma) => {
      return await prisma.recipe.update({
        where: { id: recipeId },
        data: updateData,
        select: {
          id: true,
          name: true,
          image: true,
          batchSize: true,
          servings: true,
          instructions: true,
          userId: true,
          companyId: true,
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
      });
    });

    console.log('Recipe update successful, returning recipe:', recipe?.id);
    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Update recipe error:', error);
    console.error('Error details:', (error as any).message);
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
  }
}

// DELETE - Delete a recipe (with permission checks)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params;
    console.log('Recipe delete API called for:', recipeId);
    
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { ownedCompany: true, company: true }
      });
    });

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Determine user role
    const isCompanyOwner = !!user.ownedCompany?.id;
    const isEmployee = !!user.companyId && !user.ownedCompany?.id;
    const isPersonalUser = !user.companyId && !user.ownedCompany?.id;

    // Verify recipe exists and check permissions
    const existingRecipe = await safeDbOperation(async (prisma) => {
      return await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: {
          id: true,
          userId: true,
          companyId: true,
          originalOwnerId: true
        }
      });
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Permission rules:
    // - Company recipes: 
    //   * Company owner can delete all company recipes
    //   * Employee can delete business recipes they created (originalOwnerId matches)
    // - Personal recipes: Only the owner (userId matches) can delete
    const isCompanyRecipe = !!existingRecipe.companyId;
    const isPersonalRecipe = !!existingRecipe.userId && !existingRecipe.companyId;
    
    let canDelete = false;
    
    if (isCompanyRecipe) {
      // Company recipe: Company owner OR employee who created it can delete
      const isRecipeCreator = existingRecipe.originalOwnerId === user.id;
      const isCompanyOwnerOfRecipe = isCompanyOwner && user.ownedCompany?.id === existingRecipe.companyId;
      canDelete = isCompanyOwnerOfRecipe || (isEmployee && isRecipeCreator);
      
      if (!canDelete) {
        return NextResponse.json({ 
          error: 'Je kunt alleen bedrijfsrecepten verwijderen die je zelf hebt toegevoegd, of als je de bedrijfseigenaar bent' 
        }, { status: 403 });
      }
    } else if (isPersonalRecipe) {
      // Personal recipe: Only the owner can delete
      canDelete = existingRecipe.userId === user.id;
      if (!canDelete) {
        return NextResponse.json({ 
          error: 'Je kunt alleen je eigen persoonlijke recepten verwijderen' 
        }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid recipe state' }, { status: 400 });
    }

    // Delete the recipe
    await safeDbOperation(async (prisma) => {
      await prisma.recipe.delete({
        where: { id: recipeId }
      });
    });

    console.log('Recipe deleted successfully:', recipeId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete recipe error:', error);
    console.error('Error details:', (error as any).message);
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 });
  }
}

