import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetUserId = userId || decodedToken.id;

    // Only allow admins to export other users' data
    if (userId && userId !== decodedToken.id && !decodedToken.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`📦 Exporting user data for user: ${targetUserId}`);

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get personal recipes
    const personalRecipes = await prisma.personalRecipe.findMany({
      where: { userId: targetUserId },
      include: {
        ingredients: true,
        categories: true
      }
    });

    // Get company recipes created by this user
    const companyRecipesCreated = await prisma.companyRecipe.findMany({
      where: { creatorId: targetUserId },
      include: {
        ingredients: true,
        categories: true,
        company: {
          select: {
            id: true,
            name: true,
            kvkNumber: true
          }
        }
      }
    });

    // Get company memberships
    const companyMemberships = await prisma.companyMembership.findMany({
      where: { userId: targetUserId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            kvkNumber: true,
            status: true
          }
        }
      }
    });

    // Get owned company
    const ownedCompany = await prisma.company.findUnique({
      where: { ownerId: targetUserId },
      select: {
        id: true,
        name: true,
        address: true,
        kvkNumber: true,
        vatNumber: true,
        companyPhone: true,
        status: true,
        createdAt: true
      }
    });

    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      user: {
        ...user,
        personalRecipes: personalRecipes.length,
        companyRecipesCreated: companyRecipesCreated.length,
        companyMemberships: companyMemberships.length,
        hasOwnedCompany: !!ownedCompany
      },
      data: {
        personalRecipes,
        companyRecipesCreated,
        companyMemberships,
        ownedCompany
      }
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${user.email}-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error: any) {
    console.error('❌ Export failed:', error);
    return NextResponse.json({
      error: 'Failed to export user data',
      message: error.message
    }, { status: 500 });
  }
}

