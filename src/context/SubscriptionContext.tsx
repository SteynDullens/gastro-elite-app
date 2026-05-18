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
import type { BillingAccessSnapshot } from "@/lib/billing/access";

type Pricing = {
  freeRecipeLimit: number;
  personalMonthly: string;
  businessBase: string;
  extraEmployee: string;
  businessMonthly: string | null;
};

type SubscriptionContextValue = {
  access: BillingAccessSnapshot | null;
  pricing: Pricing | null;
  loading: boolean;
  refreshBilling: () => Promise<void>;
  openPlans: () => void;
  closePlans: () => void;
  plansOpen: boolean;
  startPersonalCheckout: () => Promise<void>;
  startBusinessCheckout: () => Promise<void>;
  cancelPersonal: () => Promise<void>;
  checkoutLoading: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [access, setAccess] = useState<BillingAccessSnapshot | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const refreshBilling = useCallback(async () => {
    if (!user) {
      setAccess(null);
      setPricing(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/billing/status", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.access) {
        setAccess(data.access);
        setPricing(data.pricing ?? null);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshBilling();
  }, [refreshBilling]);

  const redirectToCheckout = async (url: string) => {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    throw new Error(data.error || "Checkout mislukt");
  };

  const startPersonalCheckout = async () => {
    setCheckoutLoading(true);
    try {
      await redirectToCheckout("/api/billing/checkout/personal");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const startBusinessCheckout = async () => {
    setCheckoutLoading(true);
    try {
      await redirectToCheckout("/api/billing/checkout/business");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cancelPersonal = async () => {
    const res = await fetch("/api/billing/cancel-personal", {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Opzeggen mislukt");
    await refreshBilling();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        access,
        pricing,
        loading,
        refreshBilling,
        openPlans: () => setPlansOpen(true),
        closePlans: () => setPlansOpen(false),
        plansOpen,
        startPersonalCheckout,
        startBusinessCheckout,
        cancelPersonal,
        checkoutLoading,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
