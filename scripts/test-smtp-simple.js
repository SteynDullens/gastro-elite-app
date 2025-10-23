const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('🔍 Testing SMTP connection...');
  
  const transporter = nodemailer.createTransport({
    host: 'mail.gastro-elite.com',
    port: 587,
    secure: false,
    auth: {
      user: 'noreply@gastro-elite.com',
      pass: '!Janssenstraat1211'
    }
  });

  try {
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: '"Gastro-Elite Test" <test4@gastro-elite.com>',
      to: 'yourname@gmail.com',
      subject: 'SMTP Test Email',
      html: '<h2>Test Email</h2><p>This is a test email from Gastro-Elite SMTP server.</p>'
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ SMTP test failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Response:', error.response);
  }
}

testSMTP();
