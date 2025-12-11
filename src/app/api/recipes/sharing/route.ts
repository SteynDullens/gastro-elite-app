import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

// POST - Share or unshare a personal recipe with business
// Note: With new architecture, "sharing" means creating a copy in CompanyRecipe table
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

    // Get user with company memberships
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          companyMemberships: {
            include: { company: true }
          }
        }
      });
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the user owns this personal recipe
    const personalRecipe = await safeDbOperation(async (prisma) => {
      return await prisma.personalRecipe.findUnique({
        where: {
          id: recipeId,
          userId: decoded.id
        },
        include: {
          categories: true,
          ingredients: true
        }
      });
    });

    if (!personalRecipe) {
      return NextResponse.json({ error: 'Recipe not found or not authorized' }, { status: 404 });
    }

    if (share === true) {
      // Share: Create a copy in CompanyRecipe table
      const companyMembership = user.companyMemberships[0];
      if (!companyMembership) {
        return NextResponse.json({ error: 'You must be a member of a company to share recipes' }, { status: 400 });
      }

      const companyRecipe = await safeDbOperation(async (prisma) => {
        return await prisma.companyRecipe.create({
          data: {
            name: personalRecipe.name,
            image: personalRecipe.image,
            batchSize: personalRecipe.batchSize,
            servings: personalRecipe.servings,
            instructions: personalRecipe.instructions,
            companyId: companyMembership.companyId,
            creatorId: decoded.id,
            categories: {
              connect: personalRecipe.categories.map(cat => ({ id: cat.id }))
            },
            ingredients: {
              create: personalRecipe.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit as any
              }))
            }
          },
          include: {
            categories: true,
            ingredients: true
          }
        });
      });

      if (!companyRecipe) {
        return NextResponse.json({ error: 'Failed to create company recipe copy' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        recipe: {
          ...companyRecipe,
          userId: null,
          companyId: companyRecipe.companyId,
          originalOwnerId: companyRecipe.creatorId,
          isSharedWithBusiness: false
        },
        message: 'Recipe shared with business'
      });
    } else {
      // Unshare: Delete company recipe copy if it exists
      const companyMembership = user.companyMemberships[0];
      if (companyMembership) {
        await safeDbOperation(async (prisma) => {
          await prisma.companyRecipe.deleteMany({
            where: {
              name: personalRecipe.name,
              companyId: companyMembership.companyId,
              creatorId: decoded.id
            }
          });
        });
      }

      return NextResponse.json({
        success: true,
        recipe: {
          ...personalRecipe,
          userId: personalRecipe.userId,
          companyId: null,
          originalOwnerId: personalRecipe.userId,
          isSharedWithBusiness: false
        },
        message: 'Recipe unshared from business'
      });
    }

  } catch (error: any) {
    console.error('Recipe sharing error:', error);
    return NextResponse.json({ error: 'Failed to update sharing' }, { status: 500 });
  }
}
