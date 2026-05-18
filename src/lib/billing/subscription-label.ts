/** Leesbare abonnementsstatus voor admin en UI */

export type SubscriptionSummary = {
  kind: "none" | "personal" | "business" | "employee_waived" | "admin";
  label: string;
  status: string;
  plan?: string | null;
  monthlyAmount?: string | null;
  currentPeriodEnd?: string | null;
  mollieSubscriptionId?: string | null;
  waivedByCompanyId?: string | null;
  companyName?: string | null;
};

export function formatSubscriptionForAdmin(input: {
  isAdmin: boolean;
  ownedCompany?: { id: string; name: string; status: string } | null;
  companyId?: string | null;
  companyMemberships?: { companyId: string; company?: { name: string } }[];
  userSubscription?: {
    plan: string;
    status: string;
    waivedByCompanyId: string | null;
    currentPeriodEnd: Date | null;
    mollieSubscriptionId: string | null;
  } | null;
  companySubscription?: {
    status: string;
    monthlyAmount: string | null;
    currentPeriodEnd: Date | null;
    mollieSubscriptionId: string | null;
    billedEmployeeCount: number;
  } | null;
  employerCompanyName?: string | null;
}): SubscriptionSummary {
  if (input.isAdmin) {
    return { kind: "admin", label: "Admin (volledig)", status: "admin" };
  }

  const us = input.userSubscription;
  const cs = input.companySubscription;
  const isOwner = Boolean(input.ownedCompany);

  if (isOwner && cs?.status === "active") {
    const extra =
      cs.billedEmployeeCount > 0
        ? ` · ${cs.billedEmployeeCount} medewerker(s)`
        : "";
    return {
      kind: "business",
      label: `Bedrijf — actief (€${cs.monthlyAmount ?? "12.95"}/mnd${extra})`,
      status: cs.status,
      plan: "business",
      monthlyAmount: cs.monthlyAmount,
      currentPeriodEnd: cs.currentPeriodEnd?.toISOString() ?? null,
      mollieSubscriptionId: cs.mollieSubscriptionId,
      companyName: input.ownedCompany?.name ?? null,
    };
  }

  if (isOwner) {
    const st = cs?.status ?? "inactive";
    return {
      kind: "business",
      label: st === "pending" ? "Bedrijf — betaling pending" : "Bedrijf — geen actief abonnement",
      status: st,
      plan: "business",
      monthlyAmount: cs?.monthlyAmount ?? null,
      mollieSubscriptionId: cs?.mollieSubscriptionId ?? null,
      companyName: input.ownedCompany?.name ?? null,
    };
  }

  const employed =
    Boolean(input.companyId) ||
    (input.companyMemberships && input.companyMemberships.length > 0);

  if (employed && us?.status === "waived") {
    return {
      kind: "employee_waived",
      label: `Werknemer — gedekt door werkgever${input.employerCompanyName ? ` (${input.employerCompanyName})` : ""}`,
      status: "waived",
      plan: us?.plan ?? "free",
      waivedByCompanyId: us.waivedByCompanyId,
      companyName: input.employerCompanyName ?? null,
    };
  }

  if (us?.status === "active" && us.plan === "personal") {
    return {
      kind: "personal",
      label: "Persoonlijk — actief (€6,99/mnd)",
      status: us.status,
      plan: us.plan,
      currentPeriodEnd: us.currentPeriodEnd?.toISOString() ?? null,
      mollieSubscriptionId: us.mollieSubscriptionId,
    };
  }

  if (us?.status === "pending") {
    return {
      kind: "personal",
      label: "Persoonlijk — betaling pending",
      status: us.status,
      plan: us.plan,
    };
  }

  if (us?.status === "cancelled") {
    return {
      kind: "none",
      label: "Gratis (opgezegd)",
      status: us.status,
      plan: us.plan,
    };
  }

  return {
    kind: "none",
    label: "Gratis (max. 5 recepten)",
    status: us?.status ?? "free",
    plan: us?.plan ?? "free",
  };
}
