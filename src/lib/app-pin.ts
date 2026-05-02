/**
 * Device app PIN: stored only on this device (localStorage hash).
 * Suitable for PWA / in-app browser; native shells can swap storage for Keychain.
 */

const STORAGE_PREFIX = 'gastro_pin_hash_';
const SESSION_UNLOCK_KEY = 'gastro_session_unlocked';

export async function hashPin(pin: string, userId: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${userId}::${pin}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getStoredPinHash(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_PREFIX + userId);
  } catch {
    return null;
  }
}

export async function setPinForUser(userId: string, pin: string): Promise<void> {
  const hash = await hashPin(pin, userId);
  localStorage.setItem(STORAGE_PREFIX + userId, hash);
}

export function clearPinForUser(userId: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + userId);
  } catch {
    /* ignore */
  }
}

export function hasPin(userId: string): boolean {
  return !!getStoredPinHash(userId);
}

export function isSessionUnlocked(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return sessionStorage.getItem(SESSION_UNLOCK_KEY) === '1';
  } catch {
    return true;
  }
}

export function setSessionUnlocked(): void {
  try {
    sessionStorage.setItem(SESSION_UNLOCK_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearSessionUnlock(): void {
  try {
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
  } catch {
    /* ignore */
  }
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const stored = getStoredPinHash(userId);
  if (!stored) return true;
  const h = await hashPin(pin, userId);
  return h === stored;
}

export const PIN_MIN = 4;
export const PIN_MAX = 6;

export function isValidPinFormat(pin: string): boolean {
  if (!/^\d+$/.test(pin)) return false;
  return pin.length >= PIN_MIN && pin.length <= PIN_MAX;
}
