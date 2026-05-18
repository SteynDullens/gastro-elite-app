import { NextRequest, NextResponse } from "next/server";
import { handleMolliePaymentUpdate } from "@/lib/billing/subscriptions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const paymentId = body.get("id");
    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await handleMolliePaymentUpdate(paymentId);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Billing webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
