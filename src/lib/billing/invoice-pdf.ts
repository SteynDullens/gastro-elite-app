import type { SellerDetails } from "./invoice-config";
import { formatDateNl, formatEuro } from "./invoice-config";

export type InvoicePdfInput = {
  invoiceNumber: string;
  issuedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  seller: SellerDetails;
  buyerName: string;
  buyerEmail: string;
  buyerAddress: string;
  buyerVatNumber?: string;
  description: string;
  amountExcl: number;
  vatAmount: number;
  amountIncl: number;
  vatRatePercent: number;
  molliePaymentId: string;
  paymentMethod?: string;
  isTestMode: boolean;
};

export async function generateInvoicePdfBuffer(
  input: InvoicePdfInput
): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 20;
  let y = margin;

  const line = (text: string, opts?: { bold?: boolean; size?: number }) => {
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(opts?.size ?? 10);
    doc.text(text, margin, y);
    y += opts?.size ? opts.size * 0.45 : 5;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("FACTUUR", margin, y);
  y += 12;

  if (input.isTestMode) {
    doc.setFontSize(9);
    doc.setTextColor(180, 100, 0);
    doc.text("TESTOMGEIVING — Geen geldige fiscale factuur", margin, y);
    doc.setTextColor(0, 0, 0);
    y += 7;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Factuurnummer: ${input.invoiceNumber}`, margin, y);
  y += 5;
  doc.text(`Factuurdatum: ${formatDateNl(input.issuedAt)}`, margin, y);
  y += 5;
  doc.text(
    `Periode: ${formatDateNl(input.periodStart)} t/m ${formatDateNl(input.periodEnd)}`,
    margin,
    y
  );
  y += 10;

  const col2 = 110;
  doc.setFont("helvetica", "bold");
  doc.text("Leverancier", margin, y);
  doc.text("Klant", col2, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  const sellerLines = [
    input.seller.name,
    ...input.seller.addressLines,
    input.seller.kvk ? `KvK: ${input.seller.kvk}` : "",
    input.seller.vatNumber ? `BTW: ${input.seller.vatNumber}` : "",
    input.seller.email,
    input.seller.iban ? `IBAN: ${input.seller.iban}` : "",
  ].filter(Boolean);

  const buyerLines = [
    input.buyerName,
    input.buyerAddress,
    input.buyerEmail,
    input.buyerVatNumber ? `BTW: ${input.buyerVatNumber}` : "",
  ].filter(Boolean);

  const maxLines = Math.max(sellerLines.length, buyerLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (sellerLines[i]) doc.text(sellerLines[i], margin, y);
    if (buyerLines[i]) doc.text(buyerLines[i], col2, y);
    y += 5;
  }
  y += 8;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, 170, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Omschrijving", margin + 2, y + 5.5);
  doc.text("Excl. BTW", 120, y + 5.5);
  doc.text("BTW", 150, y + 5.5);
  doc.text("Incl.", 175, y + 5.5);
  y += 12;

  doc.setFont("helvetica", "normal");
  const descLines = doc.splitTextToSize(input.description, 95);
  doc.text(descLines, margin + 2, y);
  const descHeight = descLines.length * 5;
  doc.text(formatEuro(input.amountExcl), 120, y);
  doc.text(formatEuro(input.vatAmount), 150, y);
  doc.text(formatEuro(input.amountIncl), 175, y);
  y += Math.max(descHeight, 6) + 4;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, 190, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Subtotaal excl. BTW", 120, y);
  doc.text(formatEuro(input.amountExcl), 175, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`BTW (${input.vatRatePercent}%)`, 120, y);
  doc.text(formatEuro(input.vatAmount), 175, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Totaal incl. BTW", 120, y);
  doc.text(formatEuro(input.amountIncl), 175, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  line("Betaling: reeds voldaan via Mollie.", { size: 9 });
  if (input.paymentMethod) {
    line(`Betaalmethode: ${input.paymentMethod}`, { size: 9 });
  }
  line(`Betalingsreferentie: ${input.molliePaymentId}`, { size: 9 });
  y += 4;
  line(
    "Abonnementsfactuur — automatisch gegenereerd bij verwerking van uw maandelijkse betaling.",
    { size: 9 }
  );

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
