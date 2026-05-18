import { SequenceType } from "@mollie/api-client";
import { randomUUID } from "crypto";
import { getAppUrl } from "@/lib/app-url";
import { safeDbOperation } from "@/lib/prisma";
import {
  BILLING_INTERVAL,
  PRICE_PERSONAL_MONTHLY,
  calculateBusinessMonthlyAmount,
} from "./constants";
import { countCompanyEmployees } from "./employees";
import { formatMollieAmount, getMollieClient } from "./mollie";

export async function ensureUserSubscriptionRow(userId: string) {
  return safeDbOperation(async (prisma) =>
    prisma.userSubscription.upsert({
      where: { userId },
      create: { userId, plan: "free", status: "free" },
      update: {},
    })
  );
}

export async function ensureCompanySubscriptionRow(companyId: string) {
  return safeDbOperation(async (prisma) =>
    prisma.companySubscription.upsert({
      where: { companyId },
      create: { companyId, status: "inactive" },
      update: {},
    })
  );
}

async function getOrCreateMollieCustomer(
  email: string,
  name: string,
  existingCustomerId?: string | null
): Promise<string | null> {
  const mollie = getMollieClient();
  if (!mollie) return null;
  if (existingCustomerId) return existingCustomerId;

  const customer = await mollie.customers.create({
    name,
    email,
  });
  return customer.id;
}

export async function startPersonalCheckout(
  userId: string,
  email: string,
  name: string
): Promise<{ checkoutUrl: string } | { error: string }> {
  const mollie = getMollieClient();
  if (!mollie) {
    return { error: "Betalingen zijn nog niet geconfigureerd (MOLLIE_API_KEY)." };
  }

  const sub = await ensureUserSubscriptionRow(userId);
  const customerId = await getOrCreateMollieCustomer(
    email,
    name,
    sub?.mollieCustomerId
  );
  if (!customerId) return { error: "Kon Mollie-klant niet aanmaken." };

  await safeDbOperation(async (prisma) =>
    prisma.userSubscription.update({
      where: { userId },
      data: {
        mollieCustomerId: customerId,
        plan: "personal",
        status: "pending",
      },
    })
  );

  const paymentId = `ge_personal_${randomUUID()}`;
  const appUrl = getAppUrl();
  const payment = await mollie.payments.create({
    amount: formatMollieAmount(PRICE_PERSONAL_MONTHLY),
    description: "Gastro-Elite — Persoonlijk abonnement (eerste betaling)",
    redirectUrl: `${appUrl}/subscription?status=return&plan=personal`,
    webhookUrl: `${appUrl}/api/billing/webhook`,
    customerId,
    sequenceType: SequenceType.first,
    metadata: {
      kind: "personal_first",
      userId,
      localId: paymentId,
    },
  });

  await safeDbOperation(async (prisma) =>
    prisma.billingPayment.create({
      data: {
        id: paymentId,
        molliePaymentId: payment.id,
        userId,
        kind: "personal_first",
        amount: PRICE_PERSONAL_MONTHLY,
        status: "open",
      },
    })
  );

  const checkoutUrl = payment.getCheckoutUrl();
  if (!checkoutUrl) return { error: "Geen betaallink ontvangen van Mollie." };
  return { checkoutUrl };
}

export async function startBusinessCheckout(
  userId: string,
  companyId: string,
  email: string,
  name: string
): Promise<{ checkoutUrl: string } | { error: string }> {
  const mollie = getMollieClient();
  if (!mollie) {
    return { error: "Betalingen zijn nog niet geconfigureerd (MOLLIE_API_KEY)." };
  }

  const company = await safeDbOperation(async (prisma) =>
    prisma.company.findUnique({
      where: { id: companyId },
      include: { companySubscription: true },
    })
  );
  if (!company || company.ownerId !== userId) {
    return { error: "Geen toegang tot dit bedrijfsaccount." };
  }

  const employeeCount = await safeDbOperation(async (prisma) =>
    countCompanyEmployees(prisma!, companyId, company.ownerId)
  );
  const amount = calculateBusinessMonthlyAmount(employeeCount ?? 0);

  await ensureCompanySubscriptionRow(companyId);
  const existingCustomerId = company.companySubscription?.mollieCustomerId;
  const customerId = await getOrCreateMollieCustomer(
    email,
    name,
    existingCustomerId
  );
  if (!customerId) return { error: "Kon Mollie-klant niet aanmaken." };

  await safeDbOperation(async (prisma) =>
    prisma.companySubscription.update({
      where: { companyId },
      data: {
        mollieCustomerId: customerId,
        status: "pending",
        billedEmployeeCount: employeeCount ?? 0,
        monthlyAmount: amount,
      },
    })
  );

  const paymentId = `ge_business_${randomUUID()}`;
  const appUrl = getAppUrl();
  const payment = await mollie.payments.create({
    amount: formatMollieAmount(amount),
    description: `Gastro-Elite — Bedrijfsabonnement (${employeeCount ?? 0} medewerker(s))`,
    redirectUrl: `${appUrl}/subscription?status=return&plan=business`,
    webhookUrl: `${appUrl}/api/billing/webhook`,
    customerId,
    sequenceType: SequenceType.first,
    metadata: {
      kind: "business_first",
      userId,
      companyId,
      localId: paymentId,
      employeeCount: String(employeeCount ?? 0),
    },
  });

  await safeDbOperation(async (prisma) =>
    prisma.billingPayment.create({
      data: {
        id: paymentId,
        molliePaymentId: payment.id,
        userId,
        companyId,
        kind: "business_first",
        amount,
        status: "open",
      },
    })
  );

  const checkoutUrl = payment.getCheckoutUrl();
  if (!checkoutUrl) return { error: "Geen betaallink ontvangen van Mollie." };
  return { checkoutUrl };
}

export async function activatePersonalSubscription(
  userId: string,
  customerId: string
): Promise<void> {
  const mollie = getMollieClient();
  if (!mollie) return;

  const subscription = await mollie.customerSubscriptions.create({
    customerId,
    amount: formatMollieAmount(PRICE_PERSONAL_MONTHLY),
    interval: BILLING_INTERVAL,
    description: "Gastro-Elite Persoonlijk",
    webhookUrl: `${getAppUrl()}/api/billing/webhook`,
  });

  const periodEnd = subscription.nextPaymentDate
    ? new Date(subscription.nextPaymentDate)
    : null;

  await safeDbOperation(async (prisma) =>
    prisma.userSubscription.update({
      where: { userId },
      data: {
        plan: "personal",
        status: "active",
        mollieCustomerId: customerId,
        mollieSubscriptionId: subscription.id,
        waivedByCompanyId: null,
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
      },
    })
  );
}

export async function activateBusinessSubscription(
  companyId: string,
  customerId: string,
  amount: string
): Promise<void> {
  const mollie = getMollieClient();
  if (!mollie) return;

  const subscription = await mollie.customerSubscriptions.create({
    customerId,
    amount: formatMollieAmount(amount),
    interval: BILLING_INTERVAL,
    description: "Gastro-Elite Bedrijf",
    webhookUrl: `${getAppUrl()}/api/billing/webhook`,
  });

  const periodEnd = subscription.nextPaymentDate
    ? new Date(subscription.nextPaymentDate)
    : null;

  await safeDbOperation(async (prisma) =>
    prisma.companySubscription.update({
      where: { companyId },
      data: {
        status: "active",
        mollieCustomerId: customerId,
        mollieSubscriptionId: subscription.id,
        monthlyAmount: amount,
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
      },
    })
  );
}

export async function handleMolliePaymentUpdate(
  molliePaymentId: string
): Promise<void> {
  const mollie = getMollieClient();
  if (!mollie) return;

  const payment = await mollie.payments.get(molliePaymentId);
  const meta = payment.metadata as Record<string, string> | null;
  const kind = meta?.kind ?? "";
  const userId = meta?.userId;
  const companyId = meta?.companyId;
  const localId = meta?.localId;

  await safeDbOperation(async (prisma) => {
    const row = await prisma.billingPayment.findFirst({
      where: {
        OR: [{ molliePaymentId }, ...(localId ? [{ id: localId }] : [])],
      },
    });
    if (row) {
      await prisma.billingPayment.update({
        where: { id: row.id },
        data: { status: payment.status, molliePaymentId: payment.id },
      });
    }
  });

  if (payment.status !== "paid") return;

  const customerId =
    typeof payment.customerId === "string" ? payment.customerId : null;
  if (!customerId) return;

  if (kind === "personal_first" && userId) {
    await activatePersonalSubscription(userId, customerId);
    return;
  }

  if (kind === "business_first" && companyId) {
    const amount =
      payment.amount?.value ??
      calculateBusinessMonthlyAmount(
        parseInt(meta?.employeeCount ?? "0", 10) || 0
      );
    await activateBusinessSubscription(companyId, customerId, amount);
    return;
  }

  await handleRecurringSubscriptionPayment(payment);
}

/** Maandelijkse incasso (iDEAL/Wero/SEPA via Mollie subscription) — verleng periode in DB. */
async function handleRecurringSubscriptionPayment(
  payment: { subscriptionId?: string | null; status: string }
): Promise<void> {
  const subId =
    typeof payment.subscriptionId === "string" ? payment.subscriptionId : null;
  if (!subId || payment.status !== "paid") return;

  const mollie = getMollieClient();
  let periodEnd: Date | null = null;
  if (mollie) {
    try {
      const userSub = await safeDbOperation(async (prisma) =>
        prisma.userSubscription.findFirst({
          where: { mollieSubscriptionId: subId },
        })
      );
      if (userSub?.mollieCustomerId) {
        const mSub = await mollie.customerSubscriptions.get(subId, {
          customerId: userSub.mollieCustomerId,
        });
        if (mSub.nextPaymentDate) periodEnd = new Date(mSub.nextPaymentDate);
      } else {
        const companySub = await safeDbOperation(async (prisma) =>
          prisma.companySubscription.findFirst({
            where: { mollieSubscriptionId: subId },
          })
        );
        if (companySub?.mollieCustomerId) {
          const mSub = await mollie.customerSubscriptions.get(subId, {
            customerId: companySub.mollieCustomerId,
          });
          if (mSub.nextPaymentDate) periodEnd = new Date(mSub.nextPaymentDate);
        }
      }
    } catch (e) {
      console.error("Recurring subscription lookup:", e);
    }
  }

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const end = periodEnd ?? nextMonth;

  await safeDbOperation(async (prisma) => {
    const userRow = await prisma.userSubscription.findFirst({
      where: { mollieSubscriptionId: subId },
    });
    if (userRow) {
      await prisma.userSubscription.update({
        where: { id: userRow.id },
        data: { status: "active", currentPeriodEnd: end },
      });
      return;
    }
    const companyRow = await prisma.companySubscription.findFirst({
      where: { mollieSubscriptionId: subId },
    });
    if (companyRow) {
      await prisma.companySubscription.update({
        where: { id: companyRow.id },
        data: { status: "active", currentPeriodEnd: end },
      });
    }
  });
}
