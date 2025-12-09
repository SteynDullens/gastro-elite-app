import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

// GET - Fetch all recipes for the user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      // Return empty recipes instead of 401 to avoid console errors
      return NextResponse.json({ recipes: [] });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      // Return empty recipes instead of 401 to avoid console errors
      return NextResponse.json({ recipes: [] });
    }

    // Get user with company info to check companyId
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          companyId: true,
          ownedCompany: {
            select: { id: true }
          }
        }
      });
    });

    const companyId = user?.companyId || user?.ownedCompany?.id;

    const recipes = await safeDbOperation(async (prisma) => {
      const whereClause: any = {
        userId: decoded.id
      };

      // Also include business recipes if user is connected to a company
      if (companyId) {
        whereClause.OR = [
          { userId: decoded.id },
          { companyId: companyId }
        ];
      }

      return await prisma.recipe.findMany({
        where: whereClause,
        include: {
          categories: true,
          ingredients: true
        },
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
          categories: true,
          ingredients: true
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    return NextResponse.json({ recipes: recipes || [] });
  } catch (error: any) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
