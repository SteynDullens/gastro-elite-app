const nodemailer = require('nodemailer');

async function testEmailDirect() {
  console.log('🧪 Testing email system directly...');
  
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

    console.log('📧 Sending test verification email...');
    const info = await transporter.sendMail({
      from: '"Gastro-Elite" <noreply@gastro-elite.com>',
      to: 'steyn@dullens.com', // Change this to your email
      subject: 'Welkom bij Gastro-Elite - Verifieer je account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF8C00;">Welkom bij Gastro-Elite!</h2>
          
          <p>Beste Test User,</p>
          
          <p>Bedankt voor je registratie bij Gastro-Elite! We zijn blij dat je je aansluit bij onze community van professionele chefs en culinaire experts.</p>
          
          <h3>Je registratiegegevens</h3>
          <ul>
            <li><strong>Naam:</strong> Test User</li>
            <li><strong>E-mail:</strong> testuser@gastro-elite.com</li>
            <li><strong>Accounttype:</strong> Persoonlijk Account</li>
          </ul>
          
          <p><strong>Belangrijk:</strong> Om je registratie te voltooien, verifieer je e-mailadres door op de knop hieronder te klikken:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://gastro-elite-app-steyn-dullens-projects.vercel.app/verify-email?token=test-token-123" 
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
    
    console.log('✅ Test verification email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('📧 Check your email inbox!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

testEmailDirect();
