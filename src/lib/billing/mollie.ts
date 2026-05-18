import createMollieClient, { type MollieClient } from "@mollie/api-client";
import { getMollieApiKey } from "./constants";

let client: MollieClient | null = null;

export function getMollieClient(): MollieClient | null {
  const key = getMollieApiKey();
  if (!key) return null;
  if (!client) {
    client = createMollieClient({ apiKey: key });
  }
  return client;
}

export function formatMollieAmount(eur: string): { currency: string; value: string } {
  return { currency: "EUR", value: parseFloat(eur).toFixed(2) };
}
