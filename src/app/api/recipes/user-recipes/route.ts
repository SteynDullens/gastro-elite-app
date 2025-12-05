import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

// GET - Fetch user's own recipes
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const recipes = await safeDbOperation(async (prisma) => {
      return await prisma.recipe.findMany({
        where: { userId: decoded.id },
        include: {
          categories: true,
          ingredients: true
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    return NextResponse.json({ recipes: recipes || [] });

  } catch (error: any) {
    console.error('Error fetching user recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}
