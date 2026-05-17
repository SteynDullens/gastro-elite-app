"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  isPlatformBiometricAvailable,
  registerPlatformBiometric,
} from "@/lib/app-biometric";
import { setDeviceLockMode } from "@/lib/device-lock";
import { clearBiometricForUser } from "@/lib/app-biometric";
import {
  clearPinForUser,
  isValidPinFormat,
  setPinForUser,
  setSessionUnlocked,
} from "@/lib/app-pin";

interface PinSetupPromptProps {
  onDismiss: () => void;
  onComplete: () => void;
  /** welcome = na eerste login; settings = account beheer */
  variant?: "welcome" | "settings";
}

type Step = "choose" | "pin-1" | "pin-2" | "biometric";

export default function PinSetupPrompt({
  onDismiss,
  onComplete,
  variant = "welcome",
}: PinSetupPromptProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("choose");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void isPlatformBiometricAvailable().then(setBiometricAvailable);
  }, []);

  if (!user) return null;

  const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;

  const append = (d: string, which: 1 | 2) => {
    const cur = which === 1 ? first : second;
    if (cur.length >= 6) return;
    if (which === 1) setFirst((s) => s + d);
    else setSecond((s) => s + d);
    setError("");
  };

  const back = (which: 1 | 2) => {
    if (which === 1) setFirst((s) => s.slice(0, -1));
    else setSecond((s) => s.slice(0, -1));
    setError("");
  };

  const handleBiometricSetup = async () => {
    setBusy(true);
    setError("");
    const result = await registerPlatformBiometric(user.id, user.email, displayName);
    setBusy(false);
    if (result.ok) {
      clearPinForUser(user.id);
      setDeviceLockMode(user.id, "biometric");
      setSessionUnlocked();
      onComplete();
      return;
    }
    if (result.error === "cancelled") {
      setError(t.lockBiometricCancelled);
      setStep("choose");
      return;
    }
    if (result.error === "unavailable" || result.error === "unsupported") {
      setError(t.lockBiometricUnavailable);
      setBiometricAvailable(false);
      setStep("choose");
      return;
    }
    setError(t.lockBiometricSetupFailed);
    setStep("choose");
  };

  const handleFirstNext = () => {
    if (!isValidPinFormat(first)) {
      setError(t.pinDigitsHint);
      return;
    }
    setStep("pin-2");
    setError("");
  };

  const handleSavePin = async () => {
    if (!isValidPinFormat(second)) {
      setError(t.pinDigitsHint);
      return;
    }
    if (first !== second) {
      setError(t.pinMismatch);
      return;
    }
    setBusy(true);
    try {
      clearBiometricForUser(user.id);
      await setPinForUser(user.id, second);
      setDeviceLockMode(user.id, "pin");
      setSessionUnlocked();
      onComplete();
    } finally {
      setBusy(false);
    }
  };

  const keypad = (which: 1 | 2) => (
    <div className="grid grid-cols-3 gap-2">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, idx) => (
        <button
          key={`${key}-${idx}`}
          type="button"
          disabled={busy || key === ""}
          onClick={() => {
            if (key === "⌫") back(which);
            else if (key) append(key, which);
          }}
          className="rounded-xl py-3 text-lg font-medium text-gray-800 transition hover:bg-gray-100 disabled:invisible"
        >
          {key}
        </button>
      ))}
    </div>
  );

  const dots = (len: number) => (
    <div className="flex justify-center gap-2 min-h-[36px]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`h-2.5 w-2.5 rounded-full border-2 ${
            i < len ? "border-orange-500 bg-orange-500" : "border-gray-300 bg-white"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        {step === "choose" && (
          <>
            <h2 className="text-lg font-semibold text-gray-900">
              {variant === "settings" ? t.lockSettingsManageTitle : t.lockSetupTitle}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {variant === "settings" ? t.lockSettingsManageDescription : t.lockSetupDescription}
            </p>

            <div className="mt-6 space-y-3">
              {biometricAvailable && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setStep("biometric");
                    void handleBiometricSetup();
                  }}
                  className="flex w-full items-start gap-3 rounded-xl border-2 border-orange-200 bg-orange-50/80 p-4 text-left transition hover:border-orange-400"
                >
                  <span className="text-2xl" aria-hidden>
                    👤
                  </span>
                  <span>
                    <span className="block font-semibold text-gray-900">{t.lockChooseBiometric}</span>
                    <span className="mt-1 block text-sm text-gray-600">{t.lockChooseBiometricHint}</span>
                  </span>
                </button>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setStep("pin-1");
                  setError("");
                }}
                className="flex w-full items-start gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:bg-gray-50"
              >
                <span className="text-2xl" aria-hidden>
                  🔢
                </span>
                <span>
                  <span className="block font-semibold text-gray-900">{t.lockChoosePin}</span>
                  <span className="mt-1 block text-sm text-gray-600">{t.lockChoosePinHint}</span>
                </span>
              </button>

              {variant === "welcome" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onDismiss}
                  className="flex w-full items-start gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:bg-gray-50"
                >
                  <span className="text-2xl" aria-hidden>
                    🔑
                  </span>
                  <span>
                    <span className="block font-semibold text-gray-900">{t.lockChoosePasswordOnly}</span>
                    <span className="mt-1 block text-sm text-gray-600">{t.lockChoosePasswordOnlyHint}</span>
                  </span>
                </button>
              )}
            </div>

            {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
          </>
        )}

        {step === "biometric" && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-gray-700">{t.lockBiometricRegistering}</p>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              className="mt-6 text-sm text-gray-600 underline"
              onClick={() => {
                setStep("choose");
                setError("");
                setBusy(false);
              }}
            >
              {t.back}
            </button>
          </div>
        )}

        {step === "pin-1" && (
          <div className="mt-2 space-y-4">
            <button
              type="button"
              className="text-sm text-orange-600"
              onClick={() => {
                setStep("choose");
                setFirst("");
                setError("");
              }}
            >
              ← {t.back}
            </button>
            <h2 className="text-lg font-semibold text-gray-900">{t.pinEnterNew}</h2>
            {dots(first.length)}
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            {keypad(1)}
            <button
              type="button"
              onClick={handleFirstNext}
              disabled={first.length < 4}
              className="w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#ff6b35" }}
            >
              {t.pinContinueButton}
            </button>
          </div>
        )}

        {step === "pin-2" && (
          <div className="mt-2 space-y-4">
            <p className="text-sm font-medium text-gray-700">{t.pinConfirmLabel}</p>
            {dots(second.length)}
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            {keypad(2)}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep("pin-1");
                  setSecond("");
                  setError("");
                }}
                className="flex-1 rounded-xl border border-gray-300 py-3 font-medium text-gray-700"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={handleSavePin}
                disabled={busy || second.length < 4}
                className="flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#ff6b35" }}
              >
                {busy ? t.processing : t.pinSetButton}
              </button>
            </div>
          </div>
        )}

        {step === "choose" && (
          <button
            type="button"
            onClick={onDismiss}
            className="mt-6 w-full text-center text-sm text-gray-600 underline"
          >
            {variant === "settings" ? t.cancel : t.pinSkip}
          </button>
        )}
      </div>
    </div>
  );
}


