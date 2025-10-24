import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🧪 Testing email delivery to:', email);
    
    // Create transporter with environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.zxcs.nl',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'noreply@gastro-elite.com',
        pass: process.env.SMTP_PASS || '!Janssenstraat1211'
      }
    });

    console.log('📧 SMTP Configuration:');
    console.log('Host:', process.env.SMTP_HOST || 'mail.zxcs.nl');
    console.log('Port:', process.env.SMTP_PORT || '465');
    console.log('User:', process.env.SMTP_USER || 'noreply@gastro-elite.com');
    console.log('Pass:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');

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

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${email}`,
      messageId: info.messageId
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
