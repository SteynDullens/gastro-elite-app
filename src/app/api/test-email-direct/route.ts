import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🧪 Testing email delivery to:', email);
    
    // Create transporter with environment variables (trimmed to remove any newlines)
    const host = (process.env.SMTP_HOST || 'mail.zxcs.nl').trim();
    const port = parseInt((process.env.SMTP_PORT || '465').trim());
    const user = (process.env.SMTP_USER || 'noreply@gastro-elite.com').trim();
    const pass = (process.env.SMTP_PASS || '!Janssenstraat1211').trim();
    
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: true,
      auth: { user, pass },
      logger: true,
      debug: true
    });

    console.log('📧 SMTP Configuration (after trim):');
    console.log('Host:', JSON.stringify(host));
    console.log('Port:', port);
    console.log('User:', JSON.stringify(user));
    console.log('Pass:', pass ? 'SET (' + pass.length + ' chars)' : 'NOT SET');

    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection successful');

    // Send test email
    const info = await transporter.sendMail({
      from: `"Gastro-Elite Test" <${process.env.SMTP_USER || 'noreply@gastro-elite.com'}>`,
      to: email,
      subject: 'Gastro-Elite Test Email',
      html: `
        <h2>🧪 Test Email</h2>
        <p>This is a test email from Gastro-Elite to verify email delivery.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>From:</strong> ${process.env.SMTP_USER || 'noreply@gastro-elite.com'}</p>
        <p><strong>To:</strong> ${email}</p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('Accepted:', JSON.stringify(info.accepted));
    console.log('Rejected:', JSON.stringify(info.rejected));
    console.log('Envelope:', JSON.stringify(info.envelope));
    console.log('Full info:', JSON.stringify(info));

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

  } catch (error) {
    console.error('❌ Email test failed:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message,
      code: (error as any).code
    }, { status: 500 });
  }
}
