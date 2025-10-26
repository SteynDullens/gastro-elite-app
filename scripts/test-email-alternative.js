const nodemailer = require('nodemailer');

async function testEmailAlternative() {
  console.log('🧪 Testing email with alternative sender...');
  
  const transporter = nodemailer.createTransport({
    host: 'mail.zxcs.nl',
    port: 465,
    secure: true,
    auth: {
      user: 'noreply@gastro-elite.com',
      pass: '!Janssenstraat1211'
    }
  });

  try {
    console.log('📧 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful');

    console.log('📧 Sending test email with different subject...');
    const info = await transporter.sendMail({
      from: '"Gastro-Elite Support" <noreply@gastro-elite.com>',
      to: 'steyn@dullens.com',
      subject: 'Test Email - Gastro-Elite System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">Test Email from Gastro-Elite</h2>
          
          <p>This is a test email to verify email delivery.</p>
          
          <p><strong>If you receive this email, the system is working correctly!</strong></p>
          
          <p>Test details:</p>
          <ul>
            <li><strong>From:</strong> noreply@gastro-elite.com</li>
            <li><strong>To:</strong> steyn@dullens.com</li>
            <li><strong>Subject:</strong> Test Email - Gastro-Elite System</li>
            <li><strong>Time:</strong> ${new Date().toISOString()}</li>
          </ul>
          
          <p>If you don't receive this email, check your spam folder or contact your email provider.</p>
          
          <p>Met vriendelijke groet,<br>Het Gastro-Elite Team</p>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('📧 Check your email inbox and spam folder!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

testEmailAlternative();
