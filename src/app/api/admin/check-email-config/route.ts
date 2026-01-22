import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !decodedToken.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check email configuration (without exposing passwords)
    const config = {
      SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
      SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
      SMTP_USER: process.env.SMTP_USER || 'NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? `SET (${process.env.SMTP_PASS.length} characters)` : 'NOT SET',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'NOT SET',
      APP_URL: process.env.APP_URL || 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET'
    };

    return NextResponse.json({
      success: true,
      config,
      warnings: [
        ...(config.SMTP_HOST === 'NOT SET' ? ['SMTP_HOST is not set'] : []),
        ...(config.SMTP_USER === 'NOT SET' ? ['SMTP_USER is not set'] : []),
        ...(config.SMTP_PASS === 'NOT SET' ? ['SMTP_PASS is not set'] : []),
        ...(config.ADMIN_EMAIL === 'NOT SET' ? ['ADMIN_EMAIL is not set'] : [])
      ]
    });
  } catch (error: any) {
    console.error('❌ Email config check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

