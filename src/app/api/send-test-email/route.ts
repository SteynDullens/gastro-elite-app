import { NextRequest, NextResponse } from 'next/server';
import { sendPersonalRegistrationConfirmation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email address is required' 
      }, { status: 400 });
    }

    // Send a test email (using personal registration confirmation as template)
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      email: email,
      phone: '+31 6 12345678'
    };

    const testToken = 'test-verification-token-12345';
    
    const emailSent = await sendPersonalRegistrationConfirmation(testData, testToken);
    
    if (emailSent) {
      return NextResponse.json({ 
        success: true, 
        message: `Test email sent successfully to ${email}!` 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send test email' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Send test email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send test email' 
    }, { status: 500 });
  }
}



