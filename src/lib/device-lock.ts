import { hasBiometric, clearBiometricForUser } from '@/lib/app-biometric';
import { hasPin, clearPinForUser } from '@/lib/app-pin';

export type DeviceLockMode = 'pin' | 'biometric';

const MODE_PREFIX = 'gastro_lock_mode_';

export function setDeviceLockMode(userId: string, mode: DeviceLockMode): void {
  try {
    localStorage.setItem(MODE_PREFIX + userId, mode);
  } catch {
    /* ignore */
  }
}

export function getDeviceLockMode(userId: string): DeviceLockMode | null {
  try {
    const v = localStorage.getItem(MODE_PREFIX + userId);
    if (v === 'pin' || v === 'biometric') return v;
    if (hasPin(userId) && !hasBiometric(userId)) return 'pin';
    if (hasBiometric(userId)) return 'biometric';
    return null;
  } catch {
    return null;
  }
}

export function hasDeviceLock(userId: string): boolean {
  const mode = getDeviceLockMode(userId);
  if (mode === 'pin') return hasPin(userId);
  if (mode === 'biometric') return hasBiometric(userId);
  return hasPin(userId) || hasBiometric(userId);
}

export function clearDeviceLock(userId: string): void {
  clearPinForUser(userId);
  clearBiometricForUser(userId);
  try {
    localStorage.removeItem(MODE_PREFIX + userId);
  } catch {
    /* ignore */
  }
}
