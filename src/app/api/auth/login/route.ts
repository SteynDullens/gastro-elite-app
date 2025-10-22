import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user using Prisma
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        ownedCompany: true,
        company: true
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new Error('Account is deactivated');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error('Je account is nog niet geverifieerd. Controleer je e-mail voor de verificatielink.');
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      throw new Error('Ongeldige inloggegevens');
    }

    // Prepare user object without password
    const { password: _, ...userWithoutPassword } = user;

    const token = generateToken(userWithoutPassword);

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    );
  }
}
