import nodemailer from "nodemailer";
import { getAppUrl } from "@/lib/app-url";
import { isResendConfigured, sendHtmlViaResend } from "@/lib/email-resend";
import { formatDateNl, formatEuro } from "./invoice-config";

function getSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendSubscriptionInvoiceEmail(params: {
  to: string;
  buyerName: string;
  invoiceNumber: string;
  amountIncl: number;
  periodStart: Date;
  periodEnd: Date;
  pdfBuffer: Buffer;
  isTestMode: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const subject = params.isTestMode
    ? `[TEST] Factuur ${params.invoiceNumber} — Gastro-Elite`
    : `Factuur ${params.invoiceNumber} — Gastro-Elite`;

  const html = `
    <p>Beste ${params.buyerName},</p>
    <p>Bij deze ontvangt u uw factuur voor het Gastro-Elite abonnement.</p>
    <ul>
      <li><strong>Factuurnummer:</strong> ${params.invoiceNumber}</li>
      <li><strong>Bedrag:</strong> ${formatEuro(params.amountIncl)} (incl. BTW)</li>
      <li><strong>Periode:</strong> ${formatDateNl(params.periodStart)} t/m ${formatDateNl(params.periodEnd)}</li>
    </ul>
    <p>De factuur staat als PDF bij deze e-mail.</p>
    <p>U kunt uw abonnement beheren via <a href="${getAppUrl()}/subscription">${getAppUrl()}/subscription</a>.</p>
    <p>Met vriendelijke groet,<br/>Gastro-Elite</p>
    ${params.isTestMode ? "<p><em>Testomgeving — geen geldige fiscale factuur.</em></p>" : ""}
  `;

  const filename = `Factuur-${params.invoiceNumber}.pdf`;

  if (isResendConfigured()) {
    const key = process.env.RESEND_API_KEY!.trim();
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM?.trim() || "Gastro-Elite <onboarding@resend.dev>",
      to: params.to,
      subject,
      html,
      attachments: [
        {
          filename,
          content: params.pdfBuffer.toString("base64"),
        },
      ],
    });
    if (!error) return { success: true };
    console.warn("Resend invoice email failed, try SMTP:", error.message);
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await getSmtpTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: params.to,
        subject,
        html,
        attachments: [{ filename, content: params.pdfBuffer }],
      });
      return { success: true };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "SMTP-fout",
      };
    }
  }

  return { success: false, error: "Geen e-mailprovider geconfigureerd" };
}
