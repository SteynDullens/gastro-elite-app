"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { isValidPinFormat } from "@/lib/app-pin";
import type { DeviceLockMode } from "@/lib/device-lock";

interface PinUnlockOverlayProps {
  lockMode: DeviceLockMode;
  onUnlockPin: (pin: string) => Promise<boolean>;
  onUnlockBiometric: () => Promise<boolean>;
}

export default function PinUnlockOverlay({
  lockMode,
  onUnlockPin,
  onUnlockBiometric,
}: PinUnlockOverlayProps) {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bioTried, setBioTried] = useState(false);

  const tryBiometric = async () => {
    setSubmitting(true);
    setError("");
    const ok = await onUnlockBiometric();
    setSubmitting(false);
    if (!ok) {
      setError(t.lockBiometricFailed);
    }
  };

  useEffect(() => {
    if (lockMode !== "biometric" || bioTried) return;
    setBioTried(true);
    void tryBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockMode]);

  const append = (d: string) => {
    if (pin.length >= 6) return;
    setPin((p) => p + d);
    setError("");
  };

  const backspace = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPinFormat(pin)) {
      setError(t.pinDigitsHint);
      return;
    }
    setSubmitting(true);
    setError("");
    const ok = await onUnlockPin(pin);
    setSubmitting(false);
    if (!ok) {
      setPin("");
      setError(t.pinWrong);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#A0A0A0] p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-center text-xl font-semibold text-gray-900">{t.pinUnlockTitle}</h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {lockMode === "biometric" ? t.lockUnlockBiometricSubtitle : t.pinUnlockSubtitle}
        </p>

        {lockMode === "biometric" ? (
          <div className="mt-6 space-y-4">
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <button
              type="button"
              disabled={submitting}
              onClick={() => void tryBiometric()}
              className="flex w-full items-center justify-center gap-3 rounded-xl py-4 font-semibold text-white shadow-lg transition disabled:opacity-50"
              style={{ backgroundColor: "#ff6b35" }}
            >
              <span className="text-2xl" aria-hidden>
                🔐
              </span>
              {submitting ? t.processing : t.lockUseBiometricUnlock}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="flex justify-center gap-2 min-h-[44px]" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full border-2 ${
                    i < pin.length ? "border-orange-500 bg-orange-500" : "border-gray-300 bg-white"
                  }`}
                />
              ))}
            </div>

            {error && <p className="text-center text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, idx) => (
                <button
                  key={`${key}-${idx}`}
                  type="button"
                  disabled={submitting || key === ""}
                  onClick={() => {
                    if (key === "⌫") backspace();
                    else if (key) append(key);
                  }}
                  className="rounded-xl py-4 text-lg font-medium text-gray-800 transition hover:bg-gray-100 disabled:invisible"
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting || pin.length < 4}
              className="w-full rounded-xl py-3.5 font-semibold text-white shadow-lg transition disabled:opacity-50"
              style={{ backgroundColor: "#ff6b35" }}
            >
              {submitting ? t.processing : t.pinSubmitUnlock}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => logout()}
          className="mt-4 w-full text-center text-sm font-medium text-orange-700 underline"
        >
          {t.pinLogoutLink}
        </button>
      </div>
    </div>
  );
}
