import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
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
    });

    if (!user || user.isBlocked) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }

    const body = await request.json();
    const { recipeId, isSharedWithBusiness } = body as {
      recipeId: string;
      isSharedWithBusiness: boolean;
    };

    if (!recipeId || typeof isSharedWithBusiness !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Verify the recipe belongs to the user
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        userId: user.id,
        originalOwnerId: user.id,
      }
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found or access denied' }, { status: 404 });
    }

    // Update the sharing status
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { isSharedWithBusiness }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update sharing error:', error);
    return NextResponse.json({ error: 'Failed to update sharing' }, { status: 500 });
  }
}


