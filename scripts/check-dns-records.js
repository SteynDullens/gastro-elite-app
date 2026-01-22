const dns = require('dns').promises;

async function checkDNSRecords(domain) {
  console.log(`\n🔍 Checking DNS records for: ${domain}\n`);
  console.log('='.repeat(60));

  // Check SPF Record
  try {
    const txtRecords = await dns.resolveTxt(domain);
    const spfRecord = txtRecords.find(record => 
      record.some(r => r.startsWith('v=spf1'))
    );
    
    if (spfRecord) {
      console.log('✅ SPF Record found:');
      console.log(`   ${spfRecord.join(' ')}`);
      
      // Check if it includes mail.zxcs.nl or allows it
      const spfText = spfRecord.join(' ');
      if (spfText.includes('mail.zxcs.nl') || spfText.includes('include:') || spfText.includes('a:') || spfText.includes('mx:')) {
        console.log('   ✓ SPF record appears to allow email sending');
      } else {
        console.log('   ⚠️  SPF record may not allow mail.zxcs.nl');
        console.log('   💡 Consider adding: v=spf1 include:mail.zxcs.nl ~all');
      }
    } else {
      console.log('❌ SPF Record NOT found');
      console.log('   💡 Add this TXT record:');
      console.log('      Name: @');
      console.log('      Type: TXT');
      console.log('      Value: v=spf1 include:mail.zxcs.nl ~all');
    }
  } catch (error) {
    console.log('❌ Error checking SPF record:', error.message);
  }

  console.log('\n' + '-'.repeat(60));

  // Check DMARC Record
  try {
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
    if (dmarcRecords && dmarcRecords.length > 0) {
      console.log('✅ DMARC Record found:');
      dmarcRecords.forEach(record => {
        console.log(`   ${record.join(' ')}`);
      });
    } else {
      console.log('❌ DMARC Record NOT found');
      console.log('   💡 Add this TXT record:');
      console.log('      Name: _dmarc');
      console.log('      Type: TXT');
      console.log('      Value: v=DMARC1; p=quarantine; rua=mailto:admin@gastro-elite.com');
    }
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      console.log('❌ DMARC Record NOT found');
      console.log('   💡 Add this TXT record:');
      console.log('      Name: _dmarc');
      console.log('      Type: TXT');
      console.log('      Value: v=DMARC1; p=quarantine; rua=mailto:admin@gastro-elite.com');
    } else {
      console.log('❌ Error checking DMARC record:', error.message);
    }
  }

  console.log('\n' + '-'.repeat(60));

  // Check MX Records
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      console.log('✅ MX Records found:');
      mxRecords.forEach(record => {
        console.log(`   ${record.priority} ${record.exchange}`);
      });
    } else {
      console.log('⚠️  No MX records found (this is OK if domain is only for sending)');
    }
  } catch (error) {
    console.log('⚠️  Error checking MX records:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Summary:');
  console.log('To improve email deliverability, ensure you have:');
  console.log('1. ✅ SPF record (v=spf1 include:mail.zxcs.nl ~all)');
  console.log('2. ✅ DMARC record (v=DMARC1; p=quarantine)');
  console.log('3. ⚠️  DKIM record (contact your email provider for this)');
  console.log('\n💡 Note: DNS changes can take up to 48 hours to propagate');
}

// Get domain from command line or use default
const domain = process.argv[2] || 'gastro-elite.com';

checkDNSRecords(domain).catch(console.error);

