"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  isValidPinFormat,
  setPinForUser,
  setSessionUnlocked,
} from "@/lib/app-pin";

interface PinSetupPromptProps {
  onDismiss: () => void;
  onComplete: () => void;
}

export default function PinSetupPrompt({ onDismiss, onComplete }: PinSetupPromptProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

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

  const handleFirstNext = () => {
    if (!isValidPinFormat(first)) {
      setError(t.pinDigitsHint);
      return;
    }
    setStep(2);
    setError("");
  };

  const handleSave = async () => {
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
      await setPinForUser(user.id, second);
      setSessionUnlocked();
      onComplete();
    } finally {
      setBusy(false);
    }
  };

  const keypad = (which: 1 | 2, value: string) => (
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
        <h2 className="text-lg font-semibold text-gray-900">{t.pinSetupQuestion}</h2>
        <p className="mt-2 text-sm text-gray-600">{t.pinSetupDescription}</p>

        {step === 1 ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm font-medium text-gray-700">{t.pinEnterNew}</p>
            {dots(first.length)}
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            {keypad(1, first)}
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
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm font-medium text-gray-700">{t.pinConfirmLabel}</p>
            {dots(second.length)}
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            {keypad(2, second)}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSecond("");
                  setError("");
                }}
                className="flex-1 rounded-xl border border-gray-300 py-3 font-medium text-gray-700"
              >
                {t.back}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={busy || second.length < 4}
                className="flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#ff6b35" }}
              >
                {busy ? t.processing : t.pinSetButton}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 w-full text-center text-sm text-gray-600 underline"
        >
          {t.pinSkip}
        </button>
      </div>
    </div>
  );
}
