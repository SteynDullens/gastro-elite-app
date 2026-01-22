/**
 * Script om een gebruiker admin rechten te geven
 * 
 * Gebruik:
 * node scripts/make-admin.js <email>
 * 
 * Of om alle gebruikers te zien:
 * node scripts/make-admin.js --list
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Gebruik:
  node scripts/make-admin.js <email>     - Geef admin rechten aan gebruiker met dit email
  node scripts/make-admin.js --list      - Toon alle gebruikers
  node scripts/make-admin.js --list-admin - Toon alleen admin gebruikers
  
Voorbeelden:
  node scripts/make-admin.js user@example.com
  node scripts/make-admin.js --list
    `);
    process.exit(0);
  }

  if (args[0] === '--list' || args[0] === '--list-admin') {
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
        emailVerified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (args[0] === '--list-admin') {
      const adminUsers = users.filter(u => u.isAdmin);
      console.log('\n📋 Admin Gebruikers:');
      console.log('='.repeat(80));
      if (adminUsers.length === 0) {
        console.log('Geen admin gebruikers gevonden.');
      } else {
        adminUsers.forEach(user => {
          console.log(`  ✓ ${user.email} - ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        });
      }
    } else {
      console.log('\n📋 Alle Gebruikers:');
      console.log('='.repeat(80));
      users.forEach(user => {
        const adminBadge = user.isAdmin ? ' [ADMIN]' : '';
        const verifiedBadge = user.emailVerified ? ' ✓' : ' ✗';
        console.log(`  ${user.email} - ${user.firstName} ${user.lastName}${adminBadge}${verifiedBadge} (ID: ${user.id})`);
      });
    }
    console.log(`\nTotaal: ${users.length} gebruiker(s)`);
    return;
  }

  const email = args[0].toLowerCase().trim();

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

    if (user.isAdmin) {
      console.log(`ℹ️  Gebruiker "${email}" heeft al admin rechten.`);
      process.exit(0);
    }

    // Make user admin
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true }
    });

    console.log(`\n✅ Admin rechten toegekend aan: ${user.firstName} ${user.lastName} (${email})`);
    console.log(`\n📝 De gebruiker kan nu inloggen op: https://gastro-elite-app.vercel.app/admin`);
    console.log(`   Of lokaal: http://localhost:3000/admin\n`);

  } catch (error) {
    console.error('❌ Fout bij het geven van admin rechten:', error.message);
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

