import { safeDbOperation } from "@/lib/prisma";
import { getMollieClient } from "./mollie";

/** Werknemer: persoonlijk abonnement tijdelijk niet vereist (werkgever betaalt). */
export async function applyEmployeeBillingWaiver(
  userId: string,
  companyId: string
): Promise<void> {
  await safeDbOperation(async (prisma) => {
    const existing = await prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (existing?.mollieSubscriptionId && existing.status === "active") {
      const mollie = getMollieClient();
      if (mollie) {
        try {
          await mollie.customerSubscriptions.cancel(
            existing.mollieSubscriptionId,
            { customerId: existing.mollieCustomerId! }
          );
        } catch (e) {
          console.error("Mollie cancel personal sub on waiver:", e);
        }
      }
    }

    await prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: existing?.plan === "personal" ? "personal" : "free",
        status: "waived",
        waivedByCompanyId: companyId,
        mollieCustomerId: existing?.mollieCustomerId,
        mollieSubscriptionId: null,
      },
      update: {
        status: "waived",
        waivedByCompanyId: companyId,
        mollieSubscriptionId: null,
        cancelledAt: null,
      },
    });
  });
}

/** Na verwijdering als werknemer: opnieuw persoonlijk abonnement vereist. */
export async function revokeEmployeeBillingWaiver(userId: string): Promise<void> {
  await safeDbOperation(async (prisma) => {
    const sub = await prisma.userSubscription.findUnique({ where: { userId } });
    if (!sub || sub.status !== "waived") return;

    await prisma.userSubscription.update({
      where: { userId },
      data: {
        status: "free",
        plan: "free",
        waivedByCompanyId: null,
        mollieSubscriptionId: null,
        currentPeriodEnd: null,
      },
    });
  });
}
