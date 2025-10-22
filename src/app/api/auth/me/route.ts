import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCachedData, setCachedData, withRetry } from '@/lib/performance';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check cache first
    const cacheKey = `user-${decoded.id}`;
    let user = getCachedData(cacheKey);
    
    if (!user) {
      // Find user using Prisma with retry
      user = await withRetry(async () => {
        return await prisma.user.findUnique({
          where: { id: decoded.id },
          include: {
            ownedCompany: true,
            company: true
          }
        });
      });
      
      // Cache the user data
      if (user) {
        setCachedData(cacheKey, user);
      }
    }

    if (!user || (user as any).isBlocked) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user as any;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error: any) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
