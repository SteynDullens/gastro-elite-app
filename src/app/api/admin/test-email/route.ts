import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { sendPasswordResetNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
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

    const { email, firstName, lastName } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🧪 Admin testing password reset email to:', email);
    
    // Send a test password reset email
    const testPassword = 'Test123!Password';
    try {
      await sendPasswordResetNotification(
        email,
        firstName || 'Test',
        lastName || 'User',
        testPassword
      );
      
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`,
        note: 'Check your inbox and spam folder. The test password is: Test123!Password'
      });
    } catch (error: any) {
      console.error('❌ Test email failed:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to send test email',
        code: error.code,
        details: {
          message: error.message,
          code: error.code,
          response: error.response,
          command: error.command
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Test email endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

