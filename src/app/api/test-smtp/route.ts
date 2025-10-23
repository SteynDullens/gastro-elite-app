import { NextResponse } from 'next/server';
import { testEmailConfiguration } from '@/lib/email';

export async function GET() {
  try {
    console.log('🧪 Testing SMTP connection...');
    const isValid = await testEmailConfiguration();
    
    return NextResponse.json({
      success: isValid,
      message: isValid ? 'SMTP connection successful' : 'SMTP connection failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('SMTP test error:', error);
    return NextResponse.json({
      success: false,
      message: 'SMTP test failed',
      error: (error as any).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
