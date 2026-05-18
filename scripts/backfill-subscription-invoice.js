/**
 * Genereer factuur voor een bestaande Mollie-betaling (eenmalig).
 * Gebruik: node scripts/backfill-subscription-invoice.js <molliePaymentId>
 */
require("dotenv").config();

async function main() {
  const paymentId = process.argv[2];
  if (!paymentId) {
    console.error("Gebruik: node scripts/backfill-subscription-invoice.js <molliePaymentId>");
    process.exit(1);
  }

  const { handleMolliePaymentUpdate } = await import(
    "../src/lib/billing/subscriptions.ts"
  ).catch(() => null);

  if (!handleMolliePaymentUpdate) {
    console.log("Backfill via API: roep webhook aan of gebruik productie deploy.");
    const { getMollieClient } = await import("../src/lib/billing/mollie.ts");
    const { issueInvoiceForMolliePayment } = await import(
      "../src/lib/billing/invoice-service.ts"
    );
    const mollie = getMollieClient();
    if (!mollie) {
      console.error("MOLLIE_API_KEY ontbreekt");
      process.exit(1);
    }
    const payment = await mollie.payments.get(paymentId);
    if (payment.status !== "paid") {
      console.error("Betaling is niet paid:", payment.status);
      process.exit(1);
    }
    await issueInvoiceForMolliePayment(payment);
    console.log("Factuur aangemaakt voor", paymentId);
    return;
  }

  await handleMolliePaymentUpdate(paymentId);
  console.log("Verwerkt:", paymentId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
