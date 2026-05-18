"use client";

import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useState } from "react";

type Props = { embedded?: boolean };

export default function SubscriptionPlans({ embedded }: Props) {
  const {
    access,
    pricing,
    startPersonalCheckout,
    startBusinessCheckout,
    cancelPersonal,
    checkoutLoading,
    refreshBilling,
  } = useSubscription();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isOwner = Boolean(user?.ownedCompany);
  const personalActive =
    access?.personalSubscriptionStatus === "active" || access?.tier === "personal";
  const waived = access?.tier === "employee_waived";
  const businessActive =
    access?.companySubscriptionActive || access?.tier === "business_owner";
  const businessPrice = pricing?.businessMonthly ?? pricing?.businessBase ?? "12.95";

  const onPersonal = async () => {
    setError(null);
    try {
      await startPersonalCheckout();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout mislukt");
    }
  };

  const onBusiness = async () => {
    setError(null);
    try {
      await startBusinessCheckout();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout mislukt");
    }
  };

  const onCancel = async () => {
    if (!confirm("Weet u zeker dat u uw persoonlijke abonnement wilt opzeggen?")) return;
    setError(null);
    try {
      await cancelPersonal();
      setMessage("Abonnement opgezegd.");
      await refreshBilling();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opzeggen mislukt");
    }
  };

  return (
    <div className={embedded ? "" : "p-2"}>
      {access?.testMode && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 text-center">
          <strong>Testomgeving</strong> — Mollie testmodus. Geen echte incasso tot livegang.
        </div>
      )}

      {waived && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-900">
          U bent teamlid met een actief bedrijfsabonnement. De werkgever betaalt; uw persoonlijke
          abonnement is niet nodig.
        </div>
      )}

      {access && !access.hasFullAccess && (
        <div className="mb-6 rounded-xl bg-orange-50 border border-orange-200 p-4 text-sm text-orange-900">
          {access.personalRecipeCount} / {access.recipeLimit ?? 5} gratis recepten. Upgrade voor
          volledige toegang.
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {message && <p className="mb-4 text-sm text-green-700">{message}</p>}

      <div className="grid md:grid-cols-3 gap-4">
        <PlanCard
          title="Gratis"
          price="€0"
          subtitle="per maand"
          features={[`Max. ${pricing?.freeRecipeLimit ?? 5} recepten`, "Basis functies"]}
          actionLabel="Huidig plan"
          disabled
        />
        <PlanCard
          title="Persoonlijk"
          highlight={!isOwner}
          price={`€${pricing?.personalMonthly ?? "6,99"}`}
          subtitle="per maand"
          features={["Onbeperkt recepten", "Alle functies", "Maandelijks opzegbaar"]}
          actionLabel={waived ? "Gedekt door werkgever" : personalActive ? "Opzeggen" : "Abonneren"}
          disabled={isOwner || waived || !access?.mollieConfigured}
          onAction={personalActive && !waived ? onCancel : onPersonal}
          loading={checkoutLoading}
        />
        <PlanCard
          title="Bedrijf"
          highlight={isOwner}
          price={`€${businessPrice}`}
          subtitle="per maand"
          features={[
            "Onbeperkt bedrijfsrecepten",
            "1 medewerker inbegrepen",
            `+ €${pricing?.extraEmployee ?? "2,00"} per extra medewerker`,
          ]}
          actionLabel={!isOwner ? "Alleen eigenaren" : businessActive ? "Actief" : "Starten"}
          disabled={!isOwner || businessActive || !access?.mollieConfigured}
          onAction={onBusiness}
          loading={checkoutLoading}
        />
      </div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  subtitle,
  features,
  actionLabel,
  onAction,
  disabled,
  loading,
  highlight,
}: {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  actionLabel: string;
  onAction?: () => void;
  disabled?: boolean;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-5 flex flex-col ${
        highlight ? "border-[#ff6b35] shadow-lg shadow-orange-100" : "border-gray-200"
      }`}
    >
      <p className="text-xs font-semibold uppercase text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{price}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
      <ul className="mt-4 space-y-2 text-sm text-gray-700 flex-1">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onAction}
        className="mt-6 w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50 border border-gray-200"
        style={
          !disabled && onAction
            ? { backgroundColor: "#ff6b35", color: "#fff", borderColor: "#ff6b35" }
            : undefined
        }
      >
        {loading ? "Bezig…" : actionLabel}
      </button>
    </div>
  );
}
