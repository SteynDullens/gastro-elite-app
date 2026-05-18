import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBillingUser } from "@/lib/billing/auth";
import { safeDbOperation } from "@/lib/prisma";
import { formatDateNl } from "@/lib/billing/invoice-config";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedBillingUser(request);
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const invoices = await safeDbOperation(async (prisma) =>
    prisma.subscriptionInvoice.findMany({
      where: { userId: user.id },
      orderBy: { issuedAt: "desc" },
      take: 48,
      select: {
        id: true,
        invoiceNumber: true,
        planType: true,
        description: true,
        amountInclVat: true,
        currency: true,
        periodStart: true,
        periodEnd: true,
        issuedAt: true,
        emailSentAt: true,
        pdfUrl: true,
      },
    })
  );

  return NextResponse.json({
    success: true,
    invoices: (invoices ?? []).map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      planType: inv.planType,
      description: inv.description,
      amountInclVat: inv.amountInclVat,
      currency: inv.currency,
      periodLabel: `${formatDateNl(inv.periodStart)} t/m ${formatDateNl(inv.periodEnd)}`,
      issuedAt: inv.issuedAt.toISOString(),
      emailSent: Boolean(inv.emailSentAt),
      downloadUrl: `/api/billing/invoices/${inv.id}/pdf`,
    })),
  });
}
