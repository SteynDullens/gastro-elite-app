import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !decodedToken.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await safeDbOperation(async (prisma) => {
      // Check if user exists and get related data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          ownedCompany: true,
          recipes: true,
          originalRecipes: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Delete related data first
      if (user.recipes.length > 0) {
        await prisma.recipe.deleteMany({
          where: { userId: user.id }
        });
      }

      if (user.originalRecipes.length > 0) {
        await prisma.recipe.updateMany({
          where: { originalOwnerId: user.id },
          data: { originalOwnerId: null }
        });
      }

      // Delete owned company if exists
      if (user.ownedCompany) {
        await prisma.company.delete({
          where: { id: user.ownedCompany.id }
        });
      }

      // Remove from company employees if applicable
      if (user.companyId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { companyId: null }
        });
      }

      // Delete the user
      await prisma.user.delete({
        where: { id: userId }
      });

      return { success: true, deletedUser: { email: user.email, id: user.id } };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

