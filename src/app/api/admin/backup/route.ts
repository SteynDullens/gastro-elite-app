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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, recipes, users, companies

    console.log(`📦 Creating backup: ${type}`);

    const backup: any = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      type,
      data: {}
    };

    // Backup users
    if (type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isBlocked: true,
          isAdmin: true,
          emailVerified: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
      backup.data.users = users;
    }

    // Backup recipes (both personal and company)
    if (type === 'all' || type === 'recipes') {
      const personalRecipes = await prisma.personalRecipe.findMany({
        include: {
          ingredients: true,
          categories: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      const companyRecipes = await prisma.companyRecipe.findMany({
        include: {
          ingredients: true,
          categories: true,
          company: {
            select: {
              id: true,
              name: true,
              kvkNumber: true
            }
          },
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      backup.data.recipes = {
        personal: personalRecipes,
        company: companyRecipes
      };
    }

    // Backup companies
    if (type === 'all' || type === 'companies') {
      const companies = await prisma.company.findMany({
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });
      backup.data.companies = companies;
    }

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${type}-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error: any) {
    console.error('❌ Backup failed:', error);
    return NextResponse.json({
      error: 'Failed to create backup',
      message: error.message
    }, { status: 500 });
  }
}

