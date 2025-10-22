import { NextRequest, NextResponse } from 'next/server';
import { verifyPasswordResetToken, markPasswordResetTokenUsed, updateUserPassword, logError } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Verify reset token
    const userId = await verifyPasswordResetToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Update password
    await updateUserPassword(userId, password);

    // Mark token as used
    await markPasswordResetTokenUsed(token);

    // Log password reset
    await logError({
      level: 'info',
      message: `Password reset completed for user ID: ${userId}`,
      userId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      url: request.url,
      method: 'POST'
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error: any) {
    await logError({
      level: 'error',
      message: `Password reset failed: ${error.message}`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      url: request.url,
      method: 'POST'
    });

    return NextResponse.json(
      { error: 'Password reset failed' },
      { status: 500 }
    );
  }
}
