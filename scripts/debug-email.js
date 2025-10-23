const nodemailer = require('nodemailer');

async function debugEmail() {
  console.log('🔍 Debugging email configuration...');
  console.log('Environment variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET');
  console.log('APP_URL:', process.env.APP_URL || 'NOT SET');
  console.log('');

  // Test with actual environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.zxcs.nl',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'noreply@gastro-elite.com',
      pass: process.env.SMTP_PASS || 'PLACEHOLDER'
    }
  });

  try {
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Gastro-Elite" <${process.env.SMTP_USER || 'noreply@gastro-elite.com'}>`,
      to: process.env.ADMIN_EMAIL || 'admin@gastro-elite.com',
      subject: 'Gastro-Elite Debug Test',
      html: `
        <h2>🔧 Email Debug Test</h2>
        <p>This is a test email to verify SMTP configuration.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>From:</strong> ${process.env.SMTP_USER || 'noreply@gastro-elite.com'}</p>
        <p><strong>To:</strong> ${process.env.ADMIN_EMAIL || 'admin@gastro-elite.com'}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Response:', error.response);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication failed. Check:');
      console.log('1. Email account exists in DirectAdmin');
      console.log('2. Password is correct');
      console.log('3. SMTP is enabled in DirectAdmin');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection failed. Check:');
      console.log('1. SMTP_HOST is correct (mail.zxcs.nl)');
      console.log('2. SMTP_PORT is correct (465)');
      console.log('3. Firewall allows outbound connections');
    }
  }
}

debugEmail();
