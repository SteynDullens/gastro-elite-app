"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAppLock } from "@/context/AppLockContext";
import {
  clearDeviceLock,
  getDeviceLockMode,
  hasDeviceLock,
} from "@/lib/device-lock";
import { setSessionUnlocked } from "@/lib/app-pin";
import PinSetupPrompt from "@/components/PinSetupPrompt";

type DeviceLockSettingsProps = {
  /** Inline panel (business tab) vs compact card (personal grid opens modal) */
  variant?: "panel" | "card";
};

export default function DeviceLockSettings({ variant = "panel" }: DeviceLockSettingsProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { refreshLockState } = useAppLock();
  const [showSetup, setShowSetup] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((n) => n + 1);
    refreshLockState();
  }, [refreshLockState]);

  if (!user) return null;

  void tick;
  const mode = getDeviceLockMode(user.id);
  const hasLock = hasDeviceLock(user.id);

  const statusLabel =
    mode === "biometric"
      ? t.lockSettingsCurrentBiometric
      : mode === "pin"
        ? t.lockSettingsCurrentPin
        : t.lockSettingsCurrentNone;

  const handleRemove = () => {
    if (!window.confirm(t.lockRemoveConfirm)) return;
    clearDeviceLock(user.id);
    setSessionUnlocked();
    refresh();
  };

  const openSetup = () => setShowSetup(true);

  const inner = (
    <>
      <p className="text-sm text-gray-600">{t.lockSettingsManageDescription}</p>
      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t.lockSettingsSection}
        </p>
        <p className="mt-1 font-medium text-gray-900">{statusLabel}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!hasLock ? (
          <button
            type="button"
            onClick={openSetup}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: "#ff6b35" }}
          >
            {t.lockSetupButton}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={openSetup}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {t.lockChangeButton}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              {t.lockRemoveButton}
            </button>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {variant === "panel" ? (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.lockSettingsSection}</h3>
          {inner}
        </div>
      ) : (
        <button
          type="button"
          onClick={openSetup}
          className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-orange-200 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <span className="text-xl" aria-hidden>
                🔐
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900">{t.lockSettingsSection}</h3>
              <p className="mt-1 text-xs text-gray-500">{statusLabel}</p>
              <p className="mt-1 text-xs text-orange-600">{t.lockSettingsCardHint}</p>
            </div>
          </div>
        </button>
      )}

      {showSetup && (
        <PinSetupPrompt
          variant="settings"
          onDismiss={() => setShowSetup(false)}
          onComplete={() => {
            setShowSetup(false);
            refresh();
          }}
        />
      )}
    </>
  );
}
