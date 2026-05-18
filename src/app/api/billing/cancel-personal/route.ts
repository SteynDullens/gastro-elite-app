import { NextRequest, NextResponse } from "next/server";
import { safeDbOperation } from "@/lib/prisma";
import { getAuthenticatedBillingUser } from "@/lib/billing/auth";
import { getMollieClient } from "@/lib/billing/mollie";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedBillingUser(request);
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const sub = user.userSubscription;
  if (!sub?.mollieSubscriptionId || !sub.mollieCustomerId) {
    return NextResponse.json(
      { error: "Geen actief persoonlijk abonnement gevonden." },
      { status: 400 }
    );
  }

  const mollie = getMollieClient();
  if (mollie) {
    try {
      await mollie.customerSubscriptions.cancel(sub.mollieSubscriptionId, {
        customerId: sub.mollieCustomerId,
      });
    } catch (e) {
      console.error("Cancel personal subscription:", e);
    }
  }

  await safeDbOperation(async (prisma) =>
    prisma.userSubscription.update({
      where: { userId: user.id },
      data: {
        status: "cancelled",
        plan: "free",
        mollieSubscriptionId: null,
        cancelledAt: new Date(),
        currentPeriodEnd: null,
      },
    })
  );

  return NextResponse.json({ success: true, message: "Abonnement opgezegd." });
}
