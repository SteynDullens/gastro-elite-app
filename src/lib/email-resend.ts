import { Resend } from 'resend';

/** Aligned with EmailSendResult in email.ts (kept here to avoid circular imports). */
export type ResendSendResult = {
  success: boolean;
  messageId?: string;
  accepted?: (string | unknown)[];
  error?: string;
};

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Sender must be verified in Resend (domain) or use onboarding@resend.dev for API testing. */
export function getResendFromAddress(): string {
  const from = process.env.RESEND_FROM?.trim();
  if (from) return from;
  return 'Gastro-Elite <onboarding@resend.dev>';
}

export async function sendHtmlViaResend(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<ResendSendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return { success: false, error: 'RESEND_API_KEY niet gezet' };
  }
  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
    return {
      success: true,
      messageId: data?.id,
      accepted: [params.to],
    };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { success: false, error: err?.message || 'Resend-fout' };
  }
}
