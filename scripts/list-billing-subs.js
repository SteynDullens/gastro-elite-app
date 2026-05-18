/** Lijst abonnementen en recente betalingen (lokaal / CI). */
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const userSubs = await prisma.userSubscription.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
    const companySubs = await prisma.companySubscription.findMany({
      include: {
        company: {
          select: {
            name: true,
            owner: { select: { email: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    const payments = await prisma.billingPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    console.log("\n=== Persoonlijke abonnementen ===");
    if (!userSubs.length) console.log("(geen)");
    for (const s of userSubs) {
      console.log(
        `- ${s.user?.email} | plan=${s.plan} status=${s.status} mollie=${s.mollieSubscriptionId || "-"}`
      );
    }

    console.log("\n=== Bedrijfsabonnementen ===");
    if (!companySubs.length) console.log("(geen)");
    for (const s of companySubs) {
      const owner = s.company?.owner;
      console.log(
        `- ${s.company?.name} (${owner?.email}) | status=${s.status} €${s.monthlyAmount || "?"} mollie=${s.mollieSubscriptionId || "-"}`
      );
    }

    console.log("\n=== Recente betalingen ===");
    if (!payments.length) console.log("(geen)");
    for (const p of payments) {
      console.log(`- ${p.molliePaymentId} | ${p.kind} | ${p.status} | €${p.amount} | user=${p.userId || "-"}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
