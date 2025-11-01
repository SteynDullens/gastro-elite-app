import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { ownedCompany: true, company: true }
    });

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    // Fetch both personal and business recipes
    const personalRecipes = await prisma.recipe.findMany({
      where: {
        userId: user.id,
      },
      include: {
        categories: true,
        ingredients: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch business recipes (if user is associated with a company)
    let businessRecipes: any[] = [];
    if (user.ownedCompany || user.company) {
      const companyId = user.ownedCompany?.id || user.company?.id;
      businessRecipes = await prisma.recipe.findMany({
        where: {
          companyId: companyId,
        },
        include: {
          categories: true,
          ingredients: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    // Fetch shared recipes from other users in the same company
    let sharedRecipes: any[] = [];
    if (user.company) {
      sharedRecipes = await prisma.recipe.findMany({
        where: {
          companyId: user.company.id,
          isSharedWithBusiness: true,
          originalOwnerId: { not: user.id }, // Exclude user's own recipes
        },
        include: {
          categories: true,
          ingredients: true,
          originalOwner: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    // Combine all recipes and remove duplicates
    const allRecipes = [...personalRecipes, ...businessRecipes, ...sharedRecipes];
    const uniqueRecipes = allRecipes.filter((recipe, index, self) => 
      index === self.findIndex(r => r.id === recipe.id)
    );

    return NextResponse.json({ recipes: uniqueRecipes });
  } catch (error) {
    console.error('Get unified recipes error:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}




