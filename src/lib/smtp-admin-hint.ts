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
    const here =
      t.includes("here") ||
      t.includes("no such recipient here") ||
      t.includes("recipient here");

    if (here) {
      return (
        "\n\n—\n" +
        "«No such recipient here» wijst vaak op gedeelde hosting-SMTP: de server probeert lokaal af te leveren in plaats van uitgaand te relayen naar externe domeinen (Gmail, iCloud, …). " +
        "Dat is meestal een relay-/poortprobleem bij de host, niet per se een fout e-mailadres in de app.\n\n" +
        "Wat je kunt doen:\n" +
        "• Hosting: uitgaande SMTP / authenticated relay inschakelen (vaak poort 587 met STARTTLS, naast 465).\n" +
        "• Of een transactional provider (Resend, SendGrid, Mailgun, Postmark) voor uitgaande mail.\n" +
        "• Controleer toch het adres in de gebruikerslijst (typfouten, verkeerd domein)."
      );
    }

    return (
      "\n\n—\n" +
      "Vaak: het ontvanger-adres bestaat niet (typfout, mailbox opgeheven), of je SMTP-server mag dat domein niet bereiken. " +
      "Controleer het adres in de gebruikerslijst; probeer desnoods een ander adres."
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
