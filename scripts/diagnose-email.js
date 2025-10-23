const nodemailer = require('nodemailer');

async function diagnoseEmail() {
  console.log('🔍 Diagnosing ZXCS email configuration...');
  console.log('Host: mail.zxcs.nl');
  console.log('Port: 587');
  console.log('User: noreply@gastro-elite.com');
  console.log('');
  
  // Test different configurations
  const configs = [
    {
      name: 'Standard SMTP (Port 587)',
      host: 'mail.zxcs.nl',
      port: 587,
      secure: false
    },
    {
      name: 'SSL SMTP (Port 465)',
      host: 'mail.zxcs.nl',
      port: 465,
      secure: true
    },
    {
      name: 'Alternative Port 25',
      host: 'mail.zxcs.nl',
      port: 25,
      secure: false
    }
  ];

  for (const config of configs) {
    console.log(`\n🧪 Testing ${config.name}...`);
    
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: 'noreply@gastro-elite.com',
        pass: 'PLACEHOLDER_PASSWORD' // Replace with actual password
      },
      // Add timeout and connection options
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    try {
      await transporter.verify();
      console.log(`✅ ${config.name} - Connection successful!`);
      console.log(`   Host: ${config.host}:${config.port}`);
      console.log(`   Secure: ${config.secure}`);
      break; // Stop on first successful connection
    } catch (error) {
      console.log(`❌ ${config.name} - Failed: ${error.message}`);
    }
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Make sure noreply@gastro-elite.com exists in DirectAdmin');
  console.log('2. Check the password is correct');
  console.log('3. Verify SMTP is enabled in DirectAdmin');
  console.log('4. Check if there are any firewall restrictions');
  console.log('5. Try different ports (587, 465, 25)');
}

diagnoseEmail();
