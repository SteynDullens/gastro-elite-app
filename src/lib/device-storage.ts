/**
 * localStorage on this device (private mode, strict browser, in-app browsers may block it).
 */

const TEST_KEY = '__gastro_storage_test__';

export function isDeviceStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(TEST_KEY, '1');
    const ok = localStorage.getItem(TEST_KEY) === '1';
    localStorage.removeItem(TEST_KEY);
    return ok;
  } catch {
    return false;
  }
}

export function deviceStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function deviceStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return localStorage.getItem(key) === value;
  } catch {
    return false;
  }
}

export function deviceStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
