const { sendPersonalRegistrationConfirmation } = require('../src/lib/email');

async function testRegistrationEmail() {
  try {
    console.log('🧪 Testing registration email...');
    
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@gastro-elite.com',
      phone: '1234567890'
    };
    
    const verificationToken = 'test-token-' + Date.now();
    
    console.log('📧 Sending registration email...');
    const result = await sendPersonalRegistrationConfirmation(testData, verificationToken);
    
    if (result) {
      console.log('✅ Registration email sent successfully!');
    } else {
      console.log('❌ Registration email failed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing registration email:', error);
    console.error('Error details:', error.message, error.code);
  }
}

testRegistrationEmail();
