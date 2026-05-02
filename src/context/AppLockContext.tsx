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
import {
  hasPin,
  isSessionUnlocked,
  setSessionUnlocked,
  verifyPin,
} from "@/lib/app-pin";
import PinUnlockOverlay from "@/components/PinUnlockOverlay";
import PinSetupPrompt from "@/components/PinSetupPrompt";

interface AppLockContextType {
  /** Call after successful password login so PIN is not asked immediately */
  afterPasswordLogin: () => void;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export function AppLockProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [locked, setLocked] = useState(false);
  const [pinPrompt, setPinPrompt] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setLocked(false);
      setPinPrompt(false);
      return;
    }

    const uid = user.id;

    if (!hasPin(uid)) {
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

  const handleUnlock = useCallback(
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
  };

  const afterPasswordLogin = useCallback(() => {
    setSessionUnlocked();
    setLocked(false);
  }, []);

  return (
    <AppLockContext.Provider value={{ afterPasswordLogin }}>
      {children}
      {user && locked && <PinUnlockOverlay onUnlock={handleUnlock} />}
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
