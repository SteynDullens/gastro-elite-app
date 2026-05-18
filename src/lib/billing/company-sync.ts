import { safeDbOperation } from "@/lib/prisma";
import { calculateBusinessMonthlyAmount } from "./constants";
import { countCompanyEmployees } from "./employees";
import { formatMollieAmount, getMollieClient } from "./mollie";

/** Werk Mollie bedrijfsabonnement bij na wijziging aantal werknemers. */
export async function syncCompanySubscriptionBilling(
  companyId: string
): Promise<void> {
  await safeDbOperation(async (prisma) => {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { companySubscription: true },
    });
    if (!company?.companySubscription) return;

    const sub = company.companySubscription;
    if (sub.status !== "active" || !sub.mollieSubscriptionId || !sub.mollieCustomerId) {
      return;
    }

    const employeeCount = await countCompanyEmployees(
      prisma,
      companyId,
      company.ownerId
    );
    const amount = calculateBusinessMonthlyAmount(employeeCount);

    await prisma.companySubscription.update({
      where: { companyId },
      data: {
        billedEmployeeCount: employeeCount,
        monthlyAmount: amount,
      },
    });

    const mollie = getMollieClient();
    if (!mollie) return;

    try {
      await mollie.customerSubscriptions.update(sub.mollieSubscriptionId, {
        customerId: sub.mollieCustomerId,
        amount: formatMollieAmount(amount),
      });
    } catch (e) {
      console.error("Mollie update company subscription amount:", e);
    }
  });
}
