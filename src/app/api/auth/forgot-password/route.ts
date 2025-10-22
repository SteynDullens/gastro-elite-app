import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { createPasswordResetToken, logError } from '@/lib/auth';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      // Check if user exists
      const [users] = await connection.execute(
        'SELECT id, email, firstName FROM users WHERE email = ? AND isActive = true',
        [email]
      );

      if (!(users as any[]).length) {
        // Don't reveal if email exists or not for security
        return NextResponse.json({
          success: true,
          message: 'If an account with that email exists, we have sent a password reset link.'
        });
      }

      const user = (users as any[])[0];

      // Create password reset token
      const resetToken = await createPasswordResetToken(user.id);

      // Send email (in production, you'd use a real email service)
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      // Log password reset request
      await logError({
        level: 'info',
        message: `Password reset requested for user: ${email}`,
        userId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        url: request.url,
        method: 'POST'
      });

      // In production, send actual email here
      console.log(`Password reset email for ${user.email}: ${resetUrl}`);

      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });

    } finally {
      connection.release();
    }

  } catch (error: any) {
    await logError({
      level: 'error',
      message: `Password reset request failed: ${error.message}`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      url: request.url,
      method: 'POST'
    });

    return NextResponse.json(
      { error: 'Password reset request failed' },
      { status: 500 }
    );
  }
}
