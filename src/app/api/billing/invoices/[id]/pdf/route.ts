import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { verifyToken } from "@/lib/auth";
import { safeDbOperation } from "@/lib/prisma";
import { collectBlobTokenCandidates } from "@/lib/vercel-blob-token";
import { generateInvoicePdfBuffer } from "@/lib/billing/invoice-pdf";
import { getSellerDetails } from "@/lib/billing/invoice-config";
import { isTestPaymentsMode } from "@/lib/billing/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const decoded = verifyToken(token);
  if (!decoded?.id) {
    return NextResponse.json({ error: "Ongeldige sessie" }, { status: 401 });
  }

  const invoice = await safeDbOperation(async (prisma) =>
    prisma.subscriptionInvoice.findUnique({ where: { id } })
  );

  if (!invoice || invoice.userId !== decoded.id) {
    return NextResponse.json({ error: "Factuur niet gevonden" }, { status: 404 });
  }

  let pdfBuffer: Buffer | null = null;

  if (invoice.pdfUrl) {
    const candidates = collectBlobTokenCandidates();
    for (const { value } of candidates) {
      try {
        const result = await get(invoice.pdfUrl, { access: "private", token: value });
        if (result && "stream" in result && result.stream) {
          const reader = result.stream.getReader();
          const chunks: Uint8Array[] = [];
          for (;;) {
            const { done, value: chunk } = await reader.read();
            if (done) break;
            if (chunk) chunks.push(chunk);
          }
          pdfBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
          break;
        }
      } catch {
        /* try next token */
      }
    }
  }

  if (!pdfBuffer) {
    const seller = getSellerDetails();
    let sellerSnap = seller;
    try {
      if (invoice.sellerSnapshot) sellerSnap = JSON.parse(invoice.sellerSnapshot);
    } catch {
      /* use default */
    }
    pdfBuffer = await generateInvoicePdfBuffer({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      seller: sellerSnap,
      buyerName: invoice.buyerName,
      buyerEmail: invoice.buyerEmail,
      buyerAddress: invoice.buyerAddress || "—",
      buyerVatNumber: invoice.buyerVatNumber || undefined,
      description: invoice.description,
      amountExcl: parseFloat(invoice.amountExclVat),
      vatAmount: parseFloat(invoice.vatAmount),
      amountIncl: parseFloat(invoice.amountInclVat),
      vatRatePercent: parseFloat(invoice.vatRatePercent),
      molliePaymentId: invoice.molliePaymentId,
      paymentMethod: invoice.paymentMethod || undefined,
      isTestMode: isTestPaymentsMode(),
    });
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Factuur-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
