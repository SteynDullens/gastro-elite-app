"use client";

import { useSubscription } from "@/context/SubscriptionContext";
import SubscriptionPlans from "./SubscriptionPlans";

export default function SubscriptionPlansModal() {
  const { plansOpen, closePlans } = useSubscription();
  if (!plansOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Sluiten"
        onClick={closePlans}
      />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Abonnementen</h2>
            <p className="text-gray-600 text-sm mt-1">
              iDEAL, creditcard en meer via Mollie
            </p>
          </div>
          <button
            type="button"
            onClick={closePlans}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>
        <SubscriptionPlans embedded />
      </div>
    </div>
  );
}
