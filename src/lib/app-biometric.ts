/**
 * Platform biometrics (Face ID, Touch ID, Android fingerprint) via Web Authentication API.
 * Works in Safari/Chrome on iOS/Android when the site is served over HTTPS (or localhost).
 */

const CRED_PREFIX = 'gastro_webauthn_cred_';

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials?.create === 'function'
  );
}

export async function isPlatformBiometricAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    const fn = PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable;
    if (typeof fn !== 'function') return false;
    return await fn();
  } catch {
    return false;
  }
}

function getRpId(): string {
  const host = window.location.hostname;
  if (host === '127.0.0.1') return 'localhost';
  return host;
}

export function getStoredCredentialId(userId: string): string | null {
  try {
    return localStorage.getItem(CRED_PREFIX + userId);
  } catch {
    return null;
  }
}

export function hasBiometric(userId: string): boolean {
  return !!getStoredCredentialId(userId);
}

export function clearBiometricForUser(userId: string): void {
  try {
    localStorage.removeItem(CRED_PREFIX + userId);
  } catch {
    /* ignore */
  }
}

export async function registerPlatformBiometric(
  userId: string,
  userEmail: string,
  displayName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isWebAuthnSupported()) {
    return { ok: false, error: 'unsupported' };
  }

  const available = await isPlatformBiometricAvailable();
  if (!available) {
    return { ok: false, error: 'unavailable' };
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userIdBytes = new TextEncoder().encode(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Gastro-Elite',
          id: getRpId(),
        },
        user: {
          id: userIdBytes,
          name: userEmail,
          displayName: displayName || userEmail,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 120000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (!credential || !(credential.rawId instanceof ArrayBuffer)) {
      return { ok: false, error: 'cancelled' };
    }

    const id = bufferToBase64url(credential.rawId);
    localStorage.setItem(CRED_PREFIX + userId, id);
    return { ok: true };
  } catch (e: unknown) {
    const name = e instanceof DOMException ? e.name : '';
    if (name === 'NotAllowedError' || name === 'AbortError') {
      return { ok: false, error: 'cancelled' };
    }
    console.error('registerPlatformBiometric:', e);
    return { ok: false, error: 'failed' };
  }
}

export async function authenticatePlatformBiometric(
  userId: string
): Promise<boolean> {
  const credId = getStoredCredentialId(userId);
  if (!credId || !isWebAuthnSupported()) return false;

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: getRpId(),
        allowCredentials: [
          {
            id: base64urlToBuffer(credId),
            type: 'public-key',
          },
        ],
        userVerification: 'required',
        timeout: 120000,
      },
    })) as PublicKeyCredential | null;

    return !!assertion;
  } catch (e) {
    console.warn('authenticatePlatformBiometric:', e);
    return false;
  }
}
