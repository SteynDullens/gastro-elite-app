/** Verkopergegevens op factuur (via omgeving). */

export type SellerDetails = {
  name: string;
  addressLines: string[];
  kvk: string;
  vatNumber: string;
  email: string;
  iban: string;
  vatRatePercent: number;
};

export function getSellerDetails(): SellerDetails {
  const vatRate = parseFloat(process.env.INVOICE_VAT_RATE || "21");
  const lines: string[] = [];
  if (process.env.INVOICE_ADDRESS_LINE1?.trim()) {
    lines.push(process.env.INVOICE_ADDRESS_LINE1.trim());
  }
  if (process.env.INVOICE_ADDRESS_LINE2?.trim()) {
    lines.push(process.env.INVOICE_ADDRESS_LINE2.trim());
  }
  if (lines.length === 0) {
    lines.push("Nederland");
  }

  return {
    name: process.env.INVOICE_COMPANY_NAME?.trim() || "Gastro-Elite",
    addressLines: lines,
    kvk: process.env.INVOICE_KVK?.trim() || "",
    vatNumber: process.env.INVOICE_VAT?.trim() || "",
    email: process.env.INVOICE_EMAIL?.trim() || "facturen@gastro-elite.nl",
    iban: process.env.INVOICE_IBAN?.trim() || "",
    vatRatePercent: Number.isFinite(vatRate) ? vatRate : 21,
  };
}

export function splitAmountInclVat(
  amountIncl: number,
  vatRatePercent: number
): { excl: number; vat: number; incl: number } {
  const rate = vatRatePercent / 100;
  const excl = amountIncl / (1 + rate);
  const vat = amountIncl - excl;
  return {
    excl: Math.round(excl * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    incl: Math.round(amountIncl * 100) / 100,
  };
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDateNl(d: Date): string {
  return d.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
