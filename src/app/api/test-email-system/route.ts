import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🧪 Testing complete email system...');
    console.log('📧 Target email:', email);
    
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
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('Pass:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');

    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection successful');

    // Send verification email (same as registration)
    const verificationToken = 'test-token-' + Date.now();
    const verificationUrl = `${process.env.APP_URL || 'https://gastro-elite-app-steyn-dullens-projects.vercel.app'}/verify-email?token=${verificationToken}`;
    
    const info = await transporter.sendMail({
      from: `"Gastro-Elite" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welkom bij Gastro-Elite - Verifieer je account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">Welkom bij Gastro-Elite!</h2>
          
          <p>Beste Test User,</p>
          
          <p>Bedankt voor je registratie bij Gastro-Elite! We zijn blij dat je je aansluit bij onze community van professionele chefs en culinaire experts.</p>
          
          <h3>Je registratiegegevens</h3>
          <ul>
            <li><strong>Naam:</strong> Test User</li>
            <li><strong>E-mail:</strong> ${email}</li>
            <li><strong>Accounttype:</strong> Persoonlijk Account</li>
          </ul>
          
          <p><strong>Belangrijk:</strong> Om je registratie te voltooien, verifieer je e-mailadres door op de knop hieronder te klikken:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #FF8C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verifieer mijn account
            </a>
          </div>
          
          <p><strong>Let op:</strong> Deze verificatielink verloopt over 24 uur om veiligheidsredenen.</p>
          
          <p>Als je vragen hebt, aarzel dan niet om contact op te nemen met ons supportteam.</p>
          
          <p>Met vriendelijke groet,<br>Het Gastro-Elite Team</p>
        </div>
      `
    });

    console.log('✅ Verification email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Verification URL:', verificationUrl);

    return NextResponse.json({
      success: true,
      message: `Verification email sent to ${email}`,
      messageId: info.messageId,
      verificationUrl: verificationUrl
    });

  } catch (error) {
    console.error('❌ Email system test failed:', error);
    return NextResponse.json({
      success: false,
      error: (error as any).message,
      code: (error as any).code
    }, { status: 500 });
  }
}
