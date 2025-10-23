const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('🔍 Testing SMTP connection...');
  console.log('Environment variables:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');
  console.log('');

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
      from: `"Gastro-Elite Test" <${process.env.SMTP_USER || 'noreply@gastro-elite.com'}>`,
      to: process.env.ADMIN_EMAIL || 'admin@gastro-elite.com',
      subject: 'SMTP Test Email',
      html: `
        <h2>🔧 SMTP Test</h2>
        <p>This is a test email to verify SMTP configuration.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>From:</strong> ${process.env.SMTP_USER || 'noreply@gastro-elite.com'}</p>
        <p><strong>To:</strong> ${process.env.ADMIN_EMAIL || 'admin@gastro-elite.com'}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ SMTP test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Response:', error.response);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication failed. Possible issues:');
      console.log('1. Email account does not exist in DirectAdmin');
      console.log('2. Password is incorrect');
      console.log('3. SMTP authentication is disabled');
      console.log('4. Account is suspended or locked');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection failed. Possible issues:');
      console.log('1. SMTP_HOST is incorrect');
      console.log('2. SMTP_PORT is incorrect');
      console.log('3. Firewall blocking connection');
      console.log('4. Server is down');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n🔧 Connection timeout. Possible issues:');
      console.log('1. Server is slow or overloaded');
      console.log('2. Network connectivity issues');
      console.log('3. Firewall blocking connection');
    }
  }
}

testSMTP();
