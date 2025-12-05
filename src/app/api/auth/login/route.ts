import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('🔐 Login attempt started');
  
  try {
    const { email, password } = await request.json();
    console.log('📧 Login for:', email);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user using Prisma with graceful error handling
    console.log('🔍 Looking up user in database...');
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          ownedCompany: {
            select: {
              id: true,
              name: true,
              status: true,
              rejectionReason: true
            }
          },
          company: true
        }
      });
    });

    if (!user) {
      console.log('❌ User not found');
      // Check if we're in dev mode without DB
      if (process.env.DEV_MODE_NO_DB === 'true') {
        return NextResponse.json(
          { error: 'Database is not available. Please set up database connection or disable DEV_MODE_NO_DB.' },
          { status: 503 }
        );
      }
      throw new Error('Invalid credentials');
    }

    console.log('✅ User found:', user.id);

    if (user.isBlocked) {
      throw new Error('Account is deactivated');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error('Je account is nog niet geverifieerd. Controleer je e-mail voor de verificatielink.');
    }

    // Check if business account is pending approval
    if (user.ownedCompany) {
      if (user.ownedCompany.status === 'pending') {
        throw new Error('Uw bedrijfsaccount wacht nog op goedkeuring. U ontvangt een e-mail zodra uw account is beoordeeld.');
      }
      if (user.ownedCompany.status === 'rejected') {
        const reason = user.ownedCompany.rejectionReason 
          ? `: ${user.ownedCompany.rejectionReason}` 
          : '.';
        throw new Error(`Uw bedrijfsaccount aanvraag is helaas afgewezen${reason}`);
      }
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      throw new Error('Ongeldige inloggegevens');
    }

    console.log('✅ Password verified');

    // Prepare user object without password
    const { password: _, ...userWithoutPassword } = user;

    const token = generateToken(userWithoutPassword as any);
    console.log('✅ Token generated');

    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token
    });

    // Set HTTP-only cookie with relaxed settings for development
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/' // Ensure cookie is sent with all requests
    });

    console.log('✅ Login successful, cookie set');
    return response;

  } catch (error: any) {
    console.error('❌ Login error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    );
  }
}
