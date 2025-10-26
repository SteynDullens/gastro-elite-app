import { NextResponse } from 'next/server';
import { sendPersonalRegistrationConfirmation } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, phone } = await request.json();
    
    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Email, firstName, and lastName are required' }, { status: 400 });
    }

    console.log('🧪 Testing registration email sending...');
    console.log('📧 Target email:', email);
    console.log('📧 First name:', firstName);
    console.log('📧 Last name:', lastName);
    
    // Generate a test verification token
    const verificationToken = 'test-token-' + Date.now();
    
    const personalData = {
      firstName,
      lastName,
      email,
      phone: phone || ''
    };
    
    console.log('📧 Personal data:', personalData);
    console.log('📧 Verification token:', verificationToken);
    
    try {
      console.log('📧 Calling sendPersonalRegistrationConfirmation...');
      const result = await sendPersonalRegistrationConfirmation(personalData, verificationToken);
      console.log('✅ Email sending result:', result);
      
      return NextResponse.json({
        success: true,
        message: `Registration email sent to ${email}`,
        verificationToken: verificationToken,
        result: result
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('Error details:', (emailError as any).message);
      console.error('Error code:', (emailError as any).code);
      
      return NextResponse.json({
        success: false,
        error: (emailError as any).message,
        code: (emailError as any).code
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test registration email failed:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 });
  }
}
