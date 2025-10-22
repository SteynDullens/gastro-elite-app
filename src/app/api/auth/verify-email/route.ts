import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verificatietoken is vereist' },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: { 
        emailVerificationToken: token,
        emailVerified: false
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Ongeldige of verlopen verificatielink' },
        { status: 400 }
      );
    }

    // Verify the user's email
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerified: true,
        emailVerificationToken: null // Clear the token after verification
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Je e-mailadres is succesvol geverifieerd! Je kunt nu inloggen.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verifiëren van je e-mail' },
      { status: 500 }
    );
  }
}