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

    // Verify recipe exists and user owns it
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

    // Check ownership: user must own the recipe (userId matches) OR be the original owner
    const isOwner = existingRecipe.userId === user.id || existingRecipe.originalOwnerId === user.id;
    const isCompanyOwner = user.ownedCompany?.id === existingRecipe.companyId;
    
    if (!isOwner && !isCompanyOwner) {
      return NextResponse.json({ error: 'Not authorized to edit this recipe' }, { status: 403 });
    }

    const body = await request.json();
    console.log('Update request body:', JSON.stringify(body, null, 2));
    
    const { name, image, batchAmount, batchUnit, ingredients, steps, categories, saveTo } = body as {
      name: string;
      image?: string;
      batchAmount?: number;
      batchUnit?: 'stuks' | 'personen' | 'portie';
      ingredients: { quantity: number; unit: string; name: string }[];
      steps: string[];
      categories: string[]; // names
      saveTo: 'personal' | 'business' | 'both';
    };

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

    // Determine if recipe should be personal or business
    let updateData: any = { ...recipeData };
    
    if (saveTo === 'personal' || saveTo === 'both') {
      // Update as personal recipe
      updateData.userId = user.id;
      updateData.companyId = null;
      updateData.isSharedWithBusiness = saveTo === 'both';
    } else if (saveTo === 'business') {
      // Update as business recipe
      if (!user.ownedCompany && !user.company) {
        return NextResponse.json({ error: 'User must be associated with a company to save business recipes' }, { status: 400 });
      }
      updateData.companyId = user.ownedCompany?.id || user.company?.id;
      updateData.userId = null;
      updateData.isSharedWithBusiness = false;
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

