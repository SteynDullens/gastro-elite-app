import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this verification token, including company info
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findFirst({
        where: { emailVerificationToken: token },
        include: {
          ownedCompany: true
        }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user to verified with timestamp
    await safeDbOperation(async (prisma) => {
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          emailVerificationToken: null
        }
      });
    });

    // Check if this is a business account
    const isBusinessAccount = !!user.ownedCompany;
    const businessStatus = user.ownedCompany?.status || null;

    // Redirect based on account type
    if (isBusinessAccount && businessStatus === 'pending') {
      return NextResponse.redirect(new URL('/login?verified=true&businessPending=true', request.url));
    }
    
    return NextResponse.redirect(new URL('/login?verified=true', request.url));

  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user with this verification token, including company info
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findFirst({
        where: { emailVerificationToken: token },
        include: {
          ownedCompany: true
        }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user to verified with timestamp
    await safeDbOperation(async (prisma) => {
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          emailVerificationToken: null
        }
      });
    });

    // Check if this is a business account
    const isBusinessAccount = !!user.ownedCompany;
    const businessStatus = user.ownedCompany?.status || null;

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      },
      isBusinessAccount,
      businessStatus
    });

  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
