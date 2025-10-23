const nodemailer = require('nodemailer');

async function testZxcsEmail() {
  console.log('🧪 Testing ZXCS email configuration...');
  
  const transporter = nodemailer.createTransporter({
    host: 'mail.zxcs.nl',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'noreply@gastro-elite.com',
      pass: process.env.SMTP_PASS || 'your-password-here'
    }
  });

  try {
    // Test connection
    console.log('Testing connection to mail.zxcs.nl...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: '"Gastro-Elite" <noreply@gastro-elite.com>',
      to: 'admin@gastro-elite.com',
      subject: 'Gastro-Elite Email Test - ZXCS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b35;">🎉 ZXCS Email Configuration Successful!</h2>
          <p>Your DirectAdmin email is working correctly with mail.zxcs.nl</p>
          <p><strong>Server:</strong> mail.zxcs.nl</p>
          <p><strong>From:</strong> noreply@gastro-elite.com</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p>This means your app can now send verification emails!</p>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check admin@gastro-elite.com for the test email');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Check your email account settings in DirectAdmin');
    console.error('Make sure noreply@gastro-elite.com exists and password is correct');
  }
}

testZxcsEmail();
