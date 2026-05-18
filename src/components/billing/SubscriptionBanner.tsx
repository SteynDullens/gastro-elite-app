"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";

export default function SubscriptionBanner() {
  const { user } = useAuth();
  const { access, openPlans } = useSubscription();

  if (!user || !access?.enforcementEnabled) return null;
  if (access.hasFullAccess) return null;

  return (
    <div className="mx-4 mt-4 mb-0 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
      <div className="text-sm text-gray-800">
        <span className="font-semibold text-[#ff6b35]">Upgrade</span>
        {" — "}
        {access.personalRecipeCount}/{access.recipeLimit ?? 5} recepten gebruikt.
        {access.needsBusinessSubscription
          ? " Activeer een bedrijfsabonnement voor alle functies."
          : " Kies een abonnement voor onbeperkte toegang."}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={openPlans}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: "#ff6b35" }}
        >
          Bekijk abonnementen
        </button>
        <Link
          href="/subscription"
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Details
        </Link>
      </div>
    </div>
  );
}
