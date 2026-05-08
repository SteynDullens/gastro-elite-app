/**
 * Eenmalig: koppel aan admin@gastro-elite.com een bedrijfsaccount (Company als eigenaar)
 * met status "approved", zodat medewerkers toegevoegd kunnen worden zoals bij andere eigenaren.
 *
 * Gebruik (lokaal of CI met DATABASE_URL naar productie):
 *   node scripts/ensure-admin-business-company.js
 *
 * Optioneel: ADMIN_TARGET_EMAIL=andere@email.nl node scripts/ensure-admin-business-company.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_TARGET_EMAIL || "admin@gastro-elite.com";

/** Placeholder KvK — vervang desgewenst in de admin/bedrijfsinstellingen in de app */
const PLACEHOLDER_KVK = "00000000";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    include: { ownedCompany: true },
  });

  if (!user) {
    console.error(`❌ Geen gebruiker gevonden met e-mail: ${ADMIN_EMAIL}`);
    process.exit(1);
  }

  if (user.ownedCompany) {
    const c = user.ownedCompany;
    console.log(`ℹ️  Er bestaat al een bedrijf: "${c.name}" (status: ${c.status})`);
    if (c.status !== "approved") {
      await prisma.company.update({
        where: { id: c.id },
        data: {
          status: "approved",
          approvedAt: c.approvedAt ?? new Date(),
          approvedBy: c.approvedBy ?? user.id,
          rejectionReason: null,
        },
      });
      console.log("✅ Bedrijfsstatus bijgewerkt naar goedgekeurd (approved).");
    } else {
      console.log("✅ Bedrijf was al goedgekeurd — geen wijziging nodig.");
    }
    return;
  }

  await prisma.company.create({
    data: {
      name: "Gastro-Elite (admin)",
      address: "Nederland",
      kvkNumber: PLACEHOLDER_KVK,
      vatNumber: null,
      companyPhone: user.phone || null,
      status: "approved",
      approvedAt: new Date(),
      approvedBy: user.id,
      ownerId: user.id,
    },
  });

  console.log(`✅ Bedrijfsaccount aangemaakt en goedgekeurd voor ${ADMIN_EMAIL}.`);
  console.log(`   Je kunt nu onder Account → ${ADMIN_EMAIL} medewerkers uitnodigen.`);
  console.log(`   Pas bedrijfsnaam/adres/KvK later aan via je accountpagina indien gewenst.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
