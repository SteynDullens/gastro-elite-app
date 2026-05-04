/** Vercel Blob read/write token shape (na prefix wisselt de rest). */
export const VERCEL_BLOB_RW_RE = /^vercel_blob_rw_[A-Za-z0-9_-]{20,256}$/;

export function normalizeTokenString(raw: string): string {
  let t = raw.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t.replace(/\s+/g, "");
}

/**
 * Alle unieke `vercel_blob_rw_`-tokens in env, **met andere keys vóór** `BLOB_READ_WRITE_TOKEN`.
 * Zo wordt een verouderde handmatige `BLOB_READ_WRITE_TOKEN` niet meer voorrang gegeven boven een
 * nieuwe token die Vercel onder een andere variabelenaam heeft gezet.
 */
export function collectBlobTokenCandidates(): { key: string; value: string }[] {
  const matches: { key: string; value: string }[] = [];
  for (const [key, val] of Object.entries(process.env)) {
    if (!val || typeof val !== "string") continue;
    const n = normalizeTokenString(val);
    if (VERCEL_BLOB_RW_RE.test(n)) {
      matches.push({ key, value: n });
    }
  }
  const seen = new Set<string>();
  const unique: { key: string; value: string }[] = [];
  for (const m of matches) {
    if (seen.has(m.value)) continue;
    seen.add(m.value);
    unique.push(m);
  }
  const nonPrimary = unique
    .filter((m) => m.key !== "BLOB_READ_WRITE_TOKEN")
    .sort((a, b) => a.key.localeCompare(b.key));
  const primary = unique.filter((m) => m.key === "BLOB_READ_WRITE_TOKEN");
  return [...nonPrimary, ...primary];
}
