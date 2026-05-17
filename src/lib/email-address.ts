/**
 * Standaardisatie voor aflevering (trims, lowercases — gangbaar voor verificatiemail).
 */
export function normalizeEmailForSMTP(raw: string): string {
  return raw.trim().toLowerCase();
}

const BASIC =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isProbablyValidEmail(raw: string): boolean {
  const n = normalizeEmailForSMTP(raw);
  return n.length <= 254 && BASIC.test(n);
}

/** Prisma `where` voor e-maillookup (hoofdletterongevoelig, getrimd). */
export function emailLookupWhere(raw: string) {
  const normalized = normalizeEmailForSMTP(raw);
  return {
    email: {
      equals: normalized,
      mode: 'insensitive' as const,
    },
  };
}
