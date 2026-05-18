/** Gratis tier: max persoonlijke recepten */
export const FREE_RECIPE_LIMIT = 5;

/** Prijzen in EUR */
export const PRICE_PERSONAL_MONTHLY = "6.99";
export const PRICE_BUSINESS_BASE = "12.95";
export const PRICE_EXTRA_EMPLOYEE = "2.00";

export const BILLING_INTERVAL = "1 month" as const;

export function calculateBusinessMonthlyAmount(employeeCount: number): string {
  const extra = Math.max(0, employeeCount - 1);
  const base = parseFloat(PRICE_BUSINESS_BASE);
  const perExtra = parseFloat(PRICE_EXTRA_EMPLOYEE);
  return (base + extra * perExtra).toFixed(2);
}

/** Betalingen alleen afdwingen als billing aan staat */
export function isBillingEnforcementEnabled(): boolean {
  return process.env.BILLING_ENFORCEMENT !== "false";
}

/** Live betalingen (productie Mollie key). Standaard uit tot expliciet aan. */
export function isPaymentsLive(): boolean {
  return process.env.PAYMENTS_LIVE === "true";
}

export function isTestPaymentsMode(): boolean {
  return !isPaymentsLive();
}

export function getMollieProfileId(): string | null {
  return process.env.MOLLIE_PROFILE_ID?.trim() || null;
}

export function getMollieApiKey(): string | null {
  const key = process.env.MOLLIE_API_KEY?.trim();
  if (!key) return null;
  if (key.startsWith("pfl_")) {
    console.warn(
      "MOLLIE_API_KEY lijkt een profiel-ID (pfl_). Zet de test API-sleutel (test_…) uit Mollie Dashboard → Developers → API keys in MOLLIE_API_KEY, en optioneel pfl_… in MOLLIE_PROFILE_ID."
    );
    return null;
  }
  if (!isPaymentsLive() && !key.startsWith("test_")) {
    console.warn(
      "MOLLIE_API_KEY moet met test_ beginnen zolang PAYMENTS_LIVE niet true is"
    );
    return null;
  }
  if (isPaymentsLive() && !key.startsWith("live_")) {
    console.warn("PAYMENTS_LIVE=true vereist een live_ Mollie API key");
    return null;
  }
  return key;
}

export function isMollieConfigured(): boolean {
  return getMollieApiKey() !== null;
}
