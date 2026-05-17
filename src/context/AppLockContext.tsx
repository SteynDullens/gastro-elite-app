"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { authenticatePlatformBiometric } from "@/lib/app-biometric";
import {
  getDeviceLockMode,
  hasDeviceLock,
  sanitizeDeviceLockState,
  type DeviceLockMode,
} from "@/lib/device-lock";
import {
  isSessionUnlocked,
  setSessionUnlocked,
  verifyPin,
} from "@/lib/app-pin";
import PinUnlockOverlay from "@/components/PinUnlockOverlay";
import PinSetupPrompt from "@/components/PinSetupPrompt";

interface AppLockContextType {
  /** Call after successful password login so lock is not asked immediately */
  afterPasswordLogin: () => void;
  /** Na wijziging in accountinstellingen */
  refreshLockState: () => void;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export function AppLockProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [locked, setLocked] = useState(false);
  const [pinPrompt, setPinPrompt] = useState(false);
  const [lockMode, setLockMode] = useState<DeviceLockMode | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setLocked(false);
      setPinPrompt(false);
      setLockMode(null);
      return;
    }

    const uid = user.id;
    sanitizeDeviceLockState(uid);
    const mode = getDeviceLockMode(uid);
    setLockMode(mode);

    if (!hasDeviceLock(uid)) {
      setLocked(false);
      try {
        if (
          typeof window !== "undefined" &&
          sessionStorage.getItem("gastro_prompt_pin_setup") === "1"
        ) {
          setPinPrompt(true);
        } else {
          setPinPrompt(false);
        }
      } catch {
        setPinPrompt(false);
      }
      return;
    }

    setPinPrompt(false);

    if (isSessionUnlocked()) {
      setLocked(false);
    } else {
      setLocked(true);
    }
  }, [user, loading]);

  const handleUnlockPin = useCallback(
    async (pin: string) => {
      if (!user) return false;
      const ok = await verifyPin(user.id, pin);
      if (ok) {
        setSessionUnlocked();
        setLocked(false);
      }
      return ok;
    },
    [user]
  );

  const handleUnlockBiometric = useCallback(async () => {
    if (!user) return false;
    const ok = await authenticatePlatformBiometric(user.id);
    if (ok) {
      setSessionUnlocked();
      setLocked(false);
    }
    return ok;
  }, [user]);

  const dismissPinPrompt = () => {
    try {
      sessionStorage.removeItem("gastro_prompt_pin_setup");
    } catch {
      /* ignore */
    }
    setPinPrompt(false);
  };

  const onPinSetupComplete = () => {
    try {
      sessionStorage.removeItem("gastro_prompt_pin_setup");
    } catch {
      /* ignore */
    }
    setPinPrompt(false);
    setSessionUnlocked();
    setLocked(false);
    if (user) {
      setLockMode(getDeviceLockMode(user.id));
    }
  };

  const afterPasswordLogin = useCallback(() => {
    setSessionUnlocked();
    setLocked(false);
  }, []);

  const refreshLockState = useCallback(() => {
    if (!user) return;
    const uid = user.id;
    const mode = getDeviceLockMode(uid);
    setLockMode(mode);
    if (!hasDeviceLock(uid)) {
      setLocked(false);
      setPinPrompt(false);
    } else if (isSessionUnlocked()) {
      setLocked(false);
    } else {
      setLocked(true);
    }
  }, [user]);

  const activeLockMode =
    user && locked ? lockMode ?? getDeviceLockMode(user.id) : null;

  return (
    <AppLockContext.Provider value={{ afterPasswordLogin, refreshLockState }}>
      {children}
      {user && activeLockMode && (
        <PinUnlockOverlay
          lockMode={activeLockMode}
          onUnlockPin={handleUnlockPin}
          onUnlockBiometric={handleUnlockBiometric}
        />
      )}
      {user && pinPrompt && !locked && (
        <PinSetupPrompt onDismiss={dismissPinPrompt} onComplete={onPinSetupComplete} />
      )}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const ctx = useContext(AppLockContext);
  if (!ctx) {
    throw new Error("useAppLock must be used within AppLockProvider");
  }
  return ctx;
}
