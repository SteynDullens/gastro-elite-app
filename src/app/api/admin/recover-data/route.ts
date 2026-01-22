import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
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

    const { entityType, entityId } = await request.json();

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Entity type and ID are required' }, { status: 400 });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    let recoveredEntity: any = null;

    switch (entityType) {
      case 'User':
        recoveredEntity = await prisma.user.update({
          where: { id: entityId },
          data: {
            deletedAt: null,
            deletedBy: null
          }
        });
        break;

      case 'Company':
        recoveredEntity = await prisma.company.update({
          where: { id: entityId },
          data: {
            deletedAt: null,
            deletedBy: null
          }
        });
        break;

      case 'PersonalRecipe':
        recoveredEntity = await prisma.personalRecipe.update({
          where: { id: entityId },
          data: {
            deletedAt: null,
            deletedBy: null
          }
        });
        break;

      case 'CompanyRecipe':
        recoveredEntity = await prisma.companyRecipe.update({
          where: { id: entityId },
          data: {
            deletedAt: null,
            deletedBy: null
          }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    // Log audit event
    await logAuditEvent({
      action: 'recover',
      entityType,
      entityId,
      userId: decodedToken.id,
      userEmail: decodedToken.email,
      details: {
        recoveredEntity: recoveredEntity
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json({
      success: true,
      message: `${entityType} recovered successfully`,
      entity: recoveredEntity
    });

  } catch (error: any) {
    console.error('❌ Recovery failed:', error);
    return NextResponse.json({
      error: 'Failed to recover data',
      message: error.message
    }, { status: 500 });
  }
}

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

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('type') || 'all';

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const deletedItems: any = {};

    if (entityType === 'all' || entityType === 'users') {
      deletedItems.users = await prisma.user.findMany({
        where: { deletedAt: { not: null } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          deletedAt: true,
          deletedBy: true
        },
        orderBy: { deletedAt: 'desc' }
      });
    }

    if (entityType === 'all' || entityType === 'companies') {
      deletedItems.companies = await prisma.company.findMany({
        where: { deletedAt: { not: null } },
        select: {
          id: true,
          name: true,
          kvkNumber: true,
          deletedAt: true,
          deletedBy: true,
          owner: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { deletedAt: 'desc' }
      });
    }

    if (entityType === 'all' || entityType === 'recipes') {
      deletedItems.personalRecipes = await prisma.personalRecipe.findMany({
        where: { deletedAt: { not: null } },
        select: {
          id: true,
          name: true,
          deletedAt: true,
          deletedBy: true,
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { deletedAt: 'desc' }
      });

      deletedItems.companyRecipes = await prisma.companyRecipe.findMany({
        where: { deletedAt: { not: null } },
        select: {
          id: true,
          name: true,
          deletedAt: true,
          deletedBy: true,
          company: {
            select: {
              name: true,
              kvkNumber: true
            }
          }
        },
        orderBy: { deletedAt: 'desc' }
      });
    }

    return NextResponse.json({
      success: true,
      deletedItems
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch deleted items:', error);
    return NextResponse.json({
      error: 'Failed to fetch deleted items',
      message: error.message
    }, { status: 500 });
  }
}

