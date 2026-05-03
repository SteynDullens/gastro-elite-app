import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

/** Do not cache /api/auth/me: serverless + 5m cache caused stale isAdmin and false "Access Denied" in AdminPanel. */

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // Return 200 with success:false to avoid console errors for unauthenticated users
      return NextResponse.json({
        success: false,
        user: null
      });
    }

    console.log('👤 /api/auth/me - Token found, verifying...');
    const decoded = verifyToken(token);
    if (!decoded) {
      // Return 200 with success:false to avoid console errors for invalid tokens
      return NextResponse.json({
        success: false,
        user: null
      });
    }

    console.log('👤 /api/auth/me - Token valid, user ID:', decoded.id);

    console.log('👤 /api/auth/me - Fetching user from database...');
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          ownedCompany: true,
          company: true,
          companyMemberships: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    if (!user) {
      console.log('👤 /api/auth/me - User not found in database');
    }

    if (!user || (user as any).isBlocked) {
      // If in dev mode without DB, return null user gracefully
      if (process.env.DEV_MODE_NO_DB === 'true') {
        return NextResponse.json({
          success: false,
          user: null,
          error: 'Database not available'
        });
      }
      console.log('👤 /api/auth/me - User not found or blocked');
      return NextResponse.json({
        success: false,
        user: null
      });
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user as any;

    console.log('👤 /api/auth/me - Success for:', userWithoutPassword.email);
    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error: any) {
    console.error('❌ Auth me error:', error.message);
    return NextResponse.json({
      success: false,
      user: null
    });
  }
}
