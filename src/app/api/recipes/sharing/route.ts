import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

// POST - Share or unshare a recipe with business
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { recipeId, share } = await request.json();

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    // Verify the user owns this recipe
    const recipe = await safeDbOperation(async (prisma) => {
      return await prisma.recipe.findFirst({
        where: {
          id: recipeId,
          userId: decoded.id
        }
      });
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found or not authorized' }, { status: 404 });
    }

    // Update sharing status
    const updatedRecipe = await safeDbOperation(async (prisma) => {
      return await prisma.recipe.update({
        where: { id: recipeId },
        data: {
          isSharedWithBusiness: share === true,
          companyId: share && decoded.companyId ? decoded.companyId : null
        }
      });
    });

    return NextResponse.json({
      success: true,
      recipe: updatedRecipe,
      message: share ? 'Recipe shared with business' : 'Recipe unshared from business'
    });

  } catch (error: any) {
    console.error('Recipe sharing error:', error);
    return NextResponse.json({ error: 'Failed to update sharing' }, { status: 500 });
  }
}