import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token en wachtwoord zijn verplicht' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Wachtwoord moet minimaal 6 karakters zijn' },
        { status: 400 }
      );
    }

    // Find user by reset token
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findFirst({
        where: { emailVerificationToken: token }
      });
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Ongeldige of verlopen reset link. Vraag een nieuwe link aan.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear the token
    await safeDbOperation(async (prisma) => {
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          emailVerificationToken: null, // Clear the reset token
          emailVerified: true, // Also verify email if not already verified
        }
      });
    });

    console.log('✅ Password reset successful for:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Wachtwoord succesvol gewijzigd'
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}
