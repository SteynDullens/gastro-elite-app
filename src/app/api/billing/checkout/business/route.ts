import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBillingUser } from "@/lib/billing/auth";
import { startBusinessCheckout } from "@/lib/billing/subscriptions";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedBillingUser(request);
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  if (!user.ownedCompany) {
    return NextResponse.json(
      { error: "Alleen bedrijfseigenaren kunnen een bedrijfsabonnement afsluiten." },
      { status: 400 }
    );
  }

  if (user.ownedCompany.status !== "approved") {
    return NextResponse.json(
      { error: "Uw bedrijfsaccount moet eerst goedgekeurd zijn." },
      { status: 400 }
    );
  }

  const result = await startBusinessCheckout(
    user.id,
    user.ownedCompany.id,
    user.email,
    `${user.firstName} ${user.lastName}`.trim()
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, checkoutUrl: result.checkoutUrl });
}
