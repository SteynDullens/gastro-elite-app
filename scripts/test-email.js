const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing email configuration...');
  
  // Your DirectAdmin SMTP settings
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'mail.gastro-elite.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'noreply@gastro-elite.com',
      pass: process.env.SMTP_PASS || 'your-password'
    }
  });

  try {
    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"Gastro-Elite" <${process.env.SMTP_USER || 'noreply@gastro-elite.com'}>`,
      to: process.env.ADMIN_EMAIL || 'admin@gastro-elite.com',
      subject: 'Gastro-Elite Email Test',
      html: `
        <h2>🎉 Email Configuration Successful!</h2>
        <p>Your DirectAdmin email is working correctly.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Check your SMTP settings in DirectAdmin');
  }
}

testEmail();
