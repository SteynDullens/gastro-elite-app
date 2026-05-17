import { hasBiometric, clearBiometricForUser } from '@/lib/app-biometric';
import { hasPin, clearPinForUser } from '@/lib/app-pin';
import {
  deviceStorageGet,
  deviceStorageRemove,
  deviceStorageSet,
} from '@/lib/device-storage';

export type DeviceLockMode = 'pin' | 'biometric';

const MODE_PREFIX = 'gastro_lock_mode_';

export function setDeviceLockMode(userId: string, mode: DeviceLockMode): boolean {
  return deviceStorageSet(MODE_PREFIX + userId, mode);
}

export function getDeviceLockMode(userId: string): DeviceLockMode | null {
  const v = deviceStorageGet(MODE_PREFIX + userId);
  if (v === 'pin' || v === 'biometric') return v;
  if (hasPin(userId) && !hasBiometric(userId)) return 'pin';
  if (hasBiometric(userId)) return 'biometric';
  return null;
}

/** Drop orphaned lock flags (e.g. storage failed halfway). */
export function sanitizeDeviceLockState(userId: string): void {
  const mode = deviceStorageGet(MODE_PREFIX + userId);
  if (mode === 'pin' && !hasPin(userId)) {
    deviceStorageRemove(MODE_PREFIX + userId);
  }
  if (mode === 'biometric' && !hasBiometric(userId)) {
    deviceStorageRemove(MODE_PREFIX + userId);
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
  deviceStorageRemove(MODE_PREFIX + userId);
}
