import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'E-mailadres is verplicht' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      });
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log('Password reset requested for non-existent email:', email);
      return NextResponse.json({
        success: true,
        message: 'Als er een account bestaat met dit e-mailadres, ontvangt u een reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    await safeDbOperation(async (prisma) => {
      return await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: resetToken, // Reusing this field for password reset
        }
      });
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        resetToken
      );
      console.log('✅ Password reset email sent to:', email);
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError);
      // Don't expose email errors to user
    }

    return NextResponse.json({
      success: true,
      message: 'Als er een account bestaat met dit e-mailadres, ontvangt u een reset link.'
    });

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden. Probeer het later opnieuw.' },
      { status: 500 }
    );
  }
}
