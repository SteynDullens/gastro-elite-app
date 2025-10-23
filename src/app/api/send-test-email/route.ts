import { NextResponse } from 'next/server';
import { sendPersonalRegistrationConfirmation } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🧪 Sending test email to:', email);
    
    // Send a test verification email
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      email: email,
      phone: '1234567890'
    };
    
    const verificationToken = 'test-token-' + Date.now();
    const success = await sendPersonalRegistrationConfirmation(testData, verificationToken);
    
    if (success) {
      console.log('✅ Test email sent successfully to:', email);
      return NextResponse.json({ 
        success: true, 
        message: `Test email sent to ${email}`,
        verificationToken: verificationToken
      });
    } else {
      console.log('❌ Failed to send test email to:', email);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send test email' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Test email failed',
      error: (error as any).message 
    }, { status: 500 });
  }
}