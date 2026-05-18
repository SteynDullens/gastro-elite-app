"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import SubscriptionPlans from "@/components/billing/SubscriptionPlans";
import Link from "next/link";

export default function SubscriptionPage() {
  const { user, loading } = useAuth();
  const { refreshBilling } = useSubscription();
  const searchParams = useSearchParams();
  const returned = searchParams.get("status") === "return";

  useEffect(() => {
    if (returned) {
      void refreshBilling();
    }
  }, [returned, refreshBilling]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">Laden…</div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Abonnementen</h1>
        <p className="text-gray-600 mb-6">Log in om een abonnement te beheren.</p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl text-white font-medium"
          style={{ backgroundColor: "#ff6b35" }}
        >
          Inloggen
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {returned && (
        <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          Bedankt! Zodra Mollie de betaling heeft bevestigd, wordt uw abonnement geactiveerd.
          Dit kan enkele seconden duren.
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Abonnement &amp; facturatie</h1>
        <p className="text-gray-600 mt-2">
          Beheer uw Gastro-Elite abonnement. Betalingen verlopen veilig via Mollie (iDEAL,
          creditcard, en meer).
        </p>
      </header>

      <SubscriptionPlans embedded />

      <p className="mt-8 text-center text-sm text-gray-500">
        <Link href="/account" className="text-[#ff6b35] hover:underline">
          Terug naar account
        </Link>
      </p>
    </div>
  );
}
