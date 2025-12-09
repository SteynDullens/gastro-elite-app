import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone,
      companyName,
      kvkNumber,
      companyAddress
    } = data;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !companyName || !kvkNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { email }
      });
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and company in a transaction
    const result = await safeDbOperation(async (prisma) => {
      return await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || '',
          emailVerified: false,
          isAdmin: false,
          isBlocked: false,
          ownedCompany: {
            create: {
              name: companyName,
              kvkNumber,
              address: companyAddress || '',
              status: 'pending' // Business accounts need approval
            }
          }
        },
        include: {
          ownedCompany: true
        }
      });
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'Business account created. Please wait for admin approval.'
    });

  } catch (error: any) {
    console.error('Business registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}