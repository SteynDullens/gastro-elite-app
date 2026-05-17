/** Canonical production URL when env is missing or points at a preview deployment. */
const PRODUCTION_DEFAULT = 'https://gastro-elite-app.vercel.app';

/** Vercel team preview hostnames (e.g. *-steyn-dullens-projects.vercel.app) — not for user-facing emails. */
function isVercelTeamPreviewHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h.includes('-projects.vercel.app');
}

function parseHostname(raw: string): string | null {
  try {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withScheme).hostname;
  } catch {
    return null;
  }
}

function isUsablePublicAppUrl(raw: string): boolean {
  const host = parseHostname(raw);
  if (!host) return false;
  if (host === 'localhost' || host.endsWith('.local')) return false;
  if (isVercelTeamPreviewHost(host)) return false;
  return true;
}

function normalizeAppUrl(raw: string): string {
  let url = raw.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  if (url.startsWith('http://') && !url.includes('localhost')) {
    url = url.replace(/^http:\/\//i, 'https://');
  }
  return url;
}

/**
 * Base URL for links in emails and redirects.
 * Prefers APP_URL / NEXT_PUBLIC_APP_URL when set to a real production host.
 * Ignores Vercel team preview URLs and forces https (except localhost in dev).
 */
export function getAppUrl(): string {
  const candidates: string[] = [];

  if (process.env.APP_URL?.trim()) {
    candidates.push(process.env.APP_URL.trim());
  }
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    candidates.push(process.env.NEXT_PUBLIC_APP_URL.trim());
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    candidates.push(
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
    );
  }

  for (const raw of candidates) {
    if (!isUsablePublicAppUrl(raw)) continue;
    return normalizeAppUrl(raw);
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return PRODUCTION_DEFAULT;
}
