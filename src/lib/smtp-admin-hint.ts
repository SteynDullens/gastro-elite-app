/**
 * Korte Nederlandse toelichting bij veelvoorkomende SMTP-meldingen (admin / logs).
 */
export function smtpResendHint(raw: string | undefined): string {
  if (!raw) return "";
  const t = raw.toLowerCase();

  if (
    t.includes("550") &&
    (t.includes("recipient") ||
      t.includes("all recipients were rejected") ||
      t.includes("no such"))
  ) {
    return (
      "\n\n—\n" +
      "Meestal betekent dit: het e-mailadres in dit account bestaat niet meer bij de provider van dat adres (typfout, mailbox opgeheven), " +
      "of jouw SMTP-server mag niet naar dat domein leveren. Controleer het adres in de gebruikerslijst en corrigeer het; vraag zo nodig een werkend adres aan de gebruiker."
    );
  }

  if (
    t.includes("553") ||
    (t.includes("554") && (t.includes("reject") || t.includes("spam")))
  ) {
    return (
      "\n\n—\n" +
      "De uitgaande mailserver weigerde de berichtinhoud of het afzenderbeleid (SPF/DKIM). Controleer SMTP-/domeininstellingen bij je hosting."
    );
  }

  if (t.includes("535") || t.includes("authentication failed")) {
    return (
      "\n\n—\n" +
      "SMTP-inlogging mislukt. Controleer SMTP_USER en SMTP_PASS op Vercel (Production)."
    );
  }

  return "";
}

/** Ruwe SMTP-tekst + optionele hint voor de admin-UI. */
export function formatSmtpErrorForAdmin(raw: string | undefined): string {
  const base = raw?.trim() || "Onbekende SMTP-fout";
  return base + smtpResendHint(raw);
}
