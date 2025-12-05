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

    // Find user with this verification token
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findFirst({
        where: { emailVerificationToken: token }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user to verified
    await safeDbOperation(async (prisma) => {
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null
        }
      });
    });

    // Redirect to login page with success message
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

    // Find user with this verification token
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findFirst({
        where: { emailVerificationToken: token }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user to verified
    await safeDbOperation(async (prisma) => {
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
