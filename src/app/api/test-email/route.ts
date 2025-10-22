import { NextRequest, NextResponse } from 'next/server';
import { testEmailConfiguration } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Test email configuration
    const isValid = await testEmailConfiguration();
    
    if (isValid) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email configuration is valid and ready to use!' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Email configuration is invalid. Please check your SMTP settings.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test email configuration' 
    }, { status: 500 });
  }
}


