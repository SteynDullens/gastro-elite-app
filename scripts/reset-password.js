/**
 * Script om een wachtwoord te resetten
 * 
 * Gebruik:
 * node scripts/reset-password.js <email> <nieuw-wachtwoord>
 * 
 * Voorbeeld:
 * node scripts/reset-password.js admin@gastro-elite.com nieuwWachtwoord123
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Gebruik:
  node scripts/reset-password.js <email> <nieuw-wachtwoord>
  
Voorbeeld:
  node scripts/reset-password.js admin@gastro-elite.com nieuwWachtwoord123
  
Let op:
  - Het wachtwoord moet minimaal 6 karakters lang zijn
  - Het wachtwoord wordt gehashed opgeslagen (veilig)
    `);
    process.exit(0);
  }

  const email = args[0].toLowerCase().trim();
  const newPassword = args[1];

  if (newPassword.length < 6) {
    console.error('❌ Fout: Wachtwoord moet minimaal 6 karakters lang zijn.');
    process.exit(1);
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true
      }
    });

    if (!user) {
      console.error(`❌ Gebruiker met email "${email}" niet gevonden.`);
      console.log('\n💡 Tip: Gebruik "node scripts/make-admin.js --list" om alle gebruikers te zien.');
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log(`\n✅ Wachtwoord succesvol gereset voor: ${user.firstName} ${user.lastName} (${email})`);
    if (user.isAdmin) {
      console.log(`   Dit is een admin account.`);
    }
    console.log(`\n📝 Je kunt nu inloggen met:`);
    console.log(`   Email: ${email}`);
    console.log(`   Wachtwoord: ${newPassword}\n`);

  } catch (error) {
    console.error('❌ Fout bij het resetten van wachtwoord:', error.message);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('❌ Onverwachte fout:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

