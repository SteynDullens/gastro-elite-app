import { safeDbOperation } from "@/lib/prisma";
import { uploadPdfToBlob } from "@/lib/blob-upload";
import {
  formatDateNl,
  getSellerDetails,
  splitAmountInclVat,
} from "./invoice-config";
import { generateInvoicePdfBuffer } from "./invoice-pdf";
import { sendSubscriptionInvoiceEmail } from "./invoice-email";
import { isTestPaymentsMode } from "./constants";
import { PRICE_PERSONAL_MONTHLY } from "./constants";

export type IssueInvoiceParams = {
  molliePaymentId: string;
  amountIncl: string;
  currency?: string;
  paymentMethod?: string;
  planType: "personal" | "business";
  userId: string;
  companyId?: string | null;
  description: string;
  periodStart: Date;
  periodEnd: Date;
};

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GE-${year}-`;

  return safeDbOperation(async (prisma) => {
    const last = await prisma.subscriptionInvoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });
    let seq = 1;
    if (last?.invoiceNumber) {
      const part = last.invoiceNumber.slice(prefix.length);
      const n = parseInt(part, 10);
      if (Number.isFinite(n)) seq = n + 1;
    }
    return `${prefix}${String(seq).padStart(5, "0")}`;
  }).then((n) => n ?? `${prefix}00001`);
}

function formatBuyerAddress(parts: {
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  companyAddress?: string | null;
}): string {
  if (parts.companyAddress?.trim()) return parts.companyAddress.trim();
  const lines: string[] = [];
  if (parts.street?.trim()) lines.push(parts.street.trim());
  const pc = [parts.postalCode, parts.city].filter(Boolean).join(" ");
  if (pc.trim()) lines.push(pc.trim());
  if (parts.country?.trim()) lines.push(parts.country.trim());
  return lines.join("\n") || "—";
}

export async function loadBuyerForInvoice(
  userId: string,
  companyId?: string | null
): Promise<{
  buyerName: string;
  buyerEmail: string;
  buyerAddress: string;
  buyerVatNumber?: string;
} | null> {
  return safeDbOperation(async (prisma) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompany: true,
      },
    });
    if (!user) return null;

    if (companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { owner: true },
      });
      if (company) {
        return {
          buyerName: company.name,
          buyerEmail: company.owner.email,
          buyerAddress: formatBuyerAddress({ companyAddress: company.address }),
          buyerVatNumber: company.vatNumber || undefined,
        };
      }
    }

    return {
      buyerName: `${user.firstName} ${user.lastName}`.trim(),
      buyerEmail: user.email,
      buyerAddress: formatBuyerAddress({
        street: user.street,
        postalCode: user.postalCode,
        city: user.city,
        country: user.country,
      }),
      buyerVatNumber: undefined,
    };
  });
}

/** Maakt PDF-factuur + e-mail bij geslaagde abonnementsbetaling (idempotent op molliePaymentId). */
export async function issueSubscriptionInvoice(
  params: IssueInvoiceParams
): Promise<{ invoiceNumber?: string; skipped?: boolean; error?: string }> {
  const existing = await safeDbOperation(async (prisma) =>
    prisma.subscriptionInvoice.findUnique({
      where: { molliePaymentId: params.molliePaymentId },
      select: { invoiceNumber: true },
    })
  );
  if (existing) {
    return { invoiceNumber: existing.invoiceNumber, skipped: true };
  }

  const buyer = await loadBuyerForInvoice(params.userId, params.companyId);
  if (!buyer) {
    return { error: "Klantgegevens niet gevonden" };
  }

  const seller = getSellerDetails();
  const amountInclNum = parseFloat(params.amountIncl);
  if (!Number.isFinite(amountInclNum) || amountInclNum <= 0) {
    return { error: "Ongeldig factuurbedrag" };
  }

  const { excl, vat, incl } = splitAmountInclVat(
    amountInclNum,
    seller.vatRatePercent
  );
  const invoiceNumber = await nextInvoiceNumber();
  const issuedAt = new Date();
  const isTestMode = isTestPaymentsMode();

  const pdfBuffer = await generateInvoicePdfBuffer({
    invoiceNumber,
    issuedAt,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    seller,
    buyerName: buyer.buyerName,
    buyerEmail: buyer.buyerEmail,
    buyerAddress: buyer.buyerAddress,
    buyerVatNumber: buyer.buyerVatNumber,
    description: params.description,
    amountExcl: excl,
    vatAmount: vat,
    amountIncl: incl,
    vatRatePercent: seller.vatRatePercent,
    molliePaymentId: params.molliePaymentId,
    paymentMethod: params.paymentMethod,
    isTestMode,
  });

  const pdfFilename = `Factuur-${invoiceNumber}.pdf`;
  const upload = await uploadPdfToBlob("invoices", pdfBuffer, pdfFilename);
  const sellerSnapshot = JSON.stringify(seller);

  const invoiceId = await safeDbOperation(async (prisma) => {
    const row = await prisma.subscriptionInvoice.create({
      data: {
        invoiceNumber,
        molliePaymentId: params.molliePaymentId,
        userId: params.userId,
        companyId: params.companyId || null,
        planType: params.planType,
        description: params.description,
        amountInclVat: incl.toFixed(2),
        amountExclVat: excl.toFixed(2),
        vatAmount: vat.toFixed(2),
        vatRatePercent: String(seller.vatRatePercent),
        currency: params.currency || "EUR",
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        buyerName: buyer.buyerName,
        buyerEmail: buyer.buyerEmail,
        buyerAddress: buyer.buyerAddress,
        buyerVatNumber: buyer.buyerVatNumber || null,
        sellerSnapshot,
        pdfUrl: upload.ok ? upload.url : null,
        pdfPathname: upload.ok ? pdfFilename : null,
        paymentMethod: params.paymentMethod || null,
        issuedAt,
      },
    });
    return row.id;
  });

  if (!invoiceId) {
    return { error: "Kon factuur niet opslaan in database" };
  }

  const emailResult = await sendSubscriptionInvoiceEmail({
    to: buyer.buyerEmail,
    buyerName: buyer.buyerName,
    invoiceNumber,
    amountIncl: incl,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    pdfBuffer,
    isTestMode,
  });

  if (emailResult.success) {
    await safeDbOperation(async (prisma) =>
      prisma.subscriptionInvoice.update({
        where: { id: invoiceId },
        data: { emailSentAt: new Date() },
      })
    );
  } else {
    console.error("Invoice email failed:", emailResult.error);
  }

  return { invoiceNumber };
}

export function subscriptionPeriodFromPayment(paidAt: Date): {
  periodStart: Date;
  periodEnd: Date;
} {
  const periodStart = new Date(paidAt);
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  periodEnd.setDate(periodEnd.getDate() - 1);
  periodEnd.setHours(23, 59, 59, 999);
  return { periodStart, periodEnd };
}

export function personalSubscriptionDescription(periodStart: Date, periodEnd: Date): string {
  return `Gastro-Elite persoonlijk abonnement (${formatDateNl(periodStart)} t/m ${formatDateNl(periodEnd)})`;
}

export function businessSubscriptionDescription(
  periodStart: Date,
  periodEnd: Date,
  employeeCount: number
): string {
  const extra =
    employeeCount > 1 ? `, ${employeeCount} medewerker(s)` : ", 1 medewerker inbegrepen";
  return `Gastro-Elite bedrijfsabonnement${extra} (${formatDateNl(periodStart)} t/m ${formatDateNl(periodEnd)})`;
}

export async function issueInvoiceForMolliePayment(payment: {
  id: string;
  amount?: { value: string; currency?: string } | null;
  method?: string | null;
  paidAt?: string | null;
  metadata?: Record<string, string> | null;
  subscriptionId?: string | null;
  customerId?: string | null;
}): Promise<void> {
  const meta = (payment.metadata ?? {}) as Record<string, string>;
  let userId: string | undefined = meta.userId;
  let companyId: string | null = meta.companyId ?? null;
  let planType: "personal" | "business" = companyId ? "business" : "personal";
  let amount = payment.amount?.value ?? PRICE_PERSONAL_MONTHLY;
  let employeeCount = parseInt(meta.employeeCount ?? "0", 10) || 0;

  const subId =
    typeof payment.subscriptionId === "string" ? payment.subscriptionId : null;

  if (subId && (!userId || !companyId)) {
    const resolved = await safeDbOperation(async (prisma) => {
      const us = await prisma.userSubscription.findFirst({
        where: { mollieSubscriptionId: subId },
        include: { user: true },
      });
      if (us) {
        return {
          userId: us.userId,
          companyId: null as string | null,
          planType: "personal" as const,
          amount: PRICE_PERSONAL_MONTHLY,
          employeeCount: 0,
        };
      }
      const cs = await prisma.companySubscription.findFirst({
        where: { mollieSubscriptionId: subId },
        include: { company: { include: { owner: true } } },
      });
      if (cs) {
        return {
          userId: cs.company.ownerId,
          companyId: cs.companyId,
          planType: "business" as const,
          amount: cs.monthlyAmount ?? "12.95",
          employeeCount: cs.billedEmployeeCount,
        };
      }
      return null;
    });
    if (resolved) {
      userId = resolved.userId;
      companyId = resolved.companyId;
      planType = resolved.planType;
      amount = resolved.amount;
      employeeCount = resolved.employeeCount;
    }
  }

  if (!userId) return;

  const paidAt = payment.paidAt ? new Date(payment.paidAt) : new Date();
  const { periodStart, periodEnd } = subscriptionPeriodFromPayment(paidAt);
  const description =
    planType === "business"
      ? businessSubscriptionDescription(periodStart, periodEnd, employeeCount)
      : personalSubscriptionDescription(periodStart, periodEnd);

  await issueSubscriptionInvoice({
    molliePaymentId: payment.id,
    amountIncl: amount,
    currency: payment.amount?.currency ?? "EUR",
    paymentMethod: payment.method ?? undefined,
    planType,
    userId,
    companyId,
    description,
    periodStart,
    periodEnd,
  });
}
