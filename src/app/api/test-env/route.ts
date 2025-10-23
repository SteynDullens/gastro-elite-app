import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
    SMTP_USER: process.env.SMTP_USER || 'NOT SET',
    SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT SET',
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'NOT SET',
    APP_URL: process.env.APP_URL || 'NOT SET'
  });
}
