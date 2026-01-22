import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get statistics (exclude soft deleted items)
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      adminUsers,
      verifiedUsers,
      totalCompanies,
      pendingCompanies,
      approvedCompanies,
      rejectedCompanies,
      totalPersonalRecipes,
      totalCompanyRecipes,
      recentUsers,
      recentCompanies
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { isBlocked: false, deletedAt: null } }),
      prisma.user.count({ where: { isBlocked: true, deletedAt: null } }),
      prisma.user.count({ where: { isAdmin: true, deletedAt: null } }),
      prisma.user.count({ where: { emailVerified: true, deletedAt: null } }),
      prisma.company.count({ where: { deletedAt: null } }),
      prisma.company.count({ where: { status: 'pending', deletedAt: null } }),
      prisma.company.count({ where: { status: 'approved', deletedAt: null } }),
      prisma.company.count({ where: { status: 'rejected', deletedAt: null } }),
      prisma.personalRecipe.count({ where: { deletedAt: null } }),
      prisma.companyRecipe.count({ where: { deletedAt: null } }),
      prisma.user.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          emailVerified: true
        }
      }),
      prisma.company.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          owner: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          blocked: blockedUsers,
          admins: adminUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers
        },
        companies: {
          total: totalCompanies,
          pending: pendingCompanies,
          approved: approvedCompanies,
          rejected: rejectedCompanies
        },
        recipes: {
          personal: totalPersonalRecipes,
          company: totalCompanyRecipes,
          total: totalPersonalRecipes + totalCompanyRecipes
        },
        recent: {
          users: recentUsers,
          companies: recentCompanies
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch stats:', error);
    return NextResponse.json({
      error: 'Failed to fetch statistics',
      message: error.message
    }, { status: 500 });
  }
}

