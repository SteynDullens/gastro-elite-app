import { safeDbOperation } from "@/lib/prisma";
import {
  FREE_RECIPE_LIMIT,
  isBillingEnforcementEnabled,
  isMollieConfigured,
  isTestPaymentsMode,
} from "./constants";
import { countCompanyEmployees } from "./employees";

export type BillingTier =
  | "free"
  | "personal"
  | "business_owner"
  | "employee_waived"
  | "admin";

export type BillingAccessSnapshot = {
  enforcementEnabled: boolean;
  testMode: boolean;
  mollieConfigured: boolean;
  tier: BillingTier;
  hasFullAccess: boolean;
  canCreateRecipe: boolean;
  recipeLimit: number | null;
  personalRecipeCount: number;
  needsPersonalSubscription: boolean;
  needsBusinessSubscription: boolean;
  isBusinessOwner: boolean;
  isEmployee: boolean;
  employeeCount: number;
  companySubscriptionActive: boolean;
  personalSubscriptionStatus: string;
  businessSubscriptionStatus: string | null;
  waivedByCompanyId: string | null;
  companyId: string | null;
  message?: string;
};

type UserWithRelations = {
  id: string;
  isAdmin: boolean;
  companyId: string | null;
  ownedCompany: { id: string; status: string } | null;
  companyMemberships: { companyId: string; company?: { id: string } }[];
  userSubscription: {
    plan: string;
    status: string;
    waivedByCompanyId: string | null;
    currentPeriodEnd: Date | null;
  } | null;
};

function isActiveSubStatus(status: string): boolean {
  return status === "active";
}

export async function getBillingAccessForUser(
  user: UserWithRelations
): Promise<BillingAccessSnapshot> {
  const enforcementEnabled = isBillingEnforcementEnabled();
  const testMode = isTestPaymentsMode();
  const mollieConfigured = isMollieConfigured();

  const personalRecipeCount = await safeDbOperation(async (prisma) =>
    prisma.personalRecipe.count({
      where: { userId: user.id, deletedAt: null },
    })
  ).then((n) => n ?? 0);

  const isBusinessOwner = Boolean(user.ownedCompany);
  const membershipCompanyId =
    user.companyMemberships?.[0]?.companyId ?? user.companyId ?? null;
  const isEmployee = Boolean(membershipCompanyId && !isBusinessOwner);

  let companySub: { status: string; companyId: string } | null = null;
  let employeeCount = 0;
  const companyId = user.ownedCompany?.id ?? membershipCompanyId ?? null;

  if (companyId) {
    companySub = await safeDbOperation(async (prisma) => {
      const sub = await prisma.companySubscription.findUnique({
        where: { companyId },
      });
      if (!sub) return null;
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { ownerId: true },
      });
      if (company) {
        employeeCount = await countCompanyEmployees(
          prisma,
          companyId,
          company.ownerId
        );
      }
      return { status: sub.status, companyId };
    });
  }

  const companySubscriptionActive = companySub
    ? isActiveSubStatus(companySub.status)
    : false;

  const userSub = user.userSubscription;
  const personalStatus = userSub?.status ?? "free";
  const waived =
    personalStatus === "waived" && Boolean(userSub?.waivedByCompanyId);
  const personalActive =
    isActiveSubStatus(personalStatus) || personalStatus === "waived";

  if (user.isAdmin) {
    return {
      enforcementEnabled,
      testMode,
      mollieConfigured,
      tier: "admin",
      hasFullAccess: true,
      canCreateRecipe: true,
      recipeLimit: null,
      personalRecipeCount,
      needsPersonalSubscription: false,
      needsBusinessSubscription: false,
      isBusinessOwner,
      isEmployee,
      employeeCount,
      companySubscriptionActive,
      personalSubscriptionStatus: personalStatus,
      businessSubscriptionStatus: companySub?.status ?? null,
      waivedByCompanyId: userSub?.waivedByCompanyId ?? null,
      companyId,
    };
  }

  if (!enforcementEnabled) {
    return {
      enforcementEnabled: false,
      testMode,
      mollieConfigured,
      tier: "free",
      hasFullAccess: true,
      canCreateRecipe: true,
      recipeLimit: null,
      personalRecipeCount,
      needsPersonalSubscription: false,
      needsBusinessSubscription: false,
      isBusinessOwner,
      isEmployee,
      employeeCount,
      companySubscriptionActive,
      personalSubscriptionStatus: personalStatus,
      businessSubscriptionStatus: companySub?.status ?? null,
      waivedByCompanyId: userSub?.waivedByCompanyId ?? null,
      companyId,
    };
  }

  let tier: BillingTier = "free";
  let hasFullAccess = false;

  if (isBusinessOwner && companySubscriptionActive) {
    tier = "business_owner";
    hasFullAccess = true;
  } else if (isEmployee && companySubscriptionActive) {
    tier = "employee_waived";
    hasFullAccess = true;
  } else if (waived && companySubscriptionActive) {
    tier = "employee_waived";
    hasFullAccess = true;
  } else if (isActiveSubStatus(personalStatus) && userSub?.plan === "personal") {
    tier = "personal";
    hasFullAccess = true;
  }

  const atRecipeLimit = personalRecipeCount >= FREE_RECIPE_LIMIT;
  const canCreateRecipe = hasFullAccess || !atRecipeLimit;

  const needsPersonalSubscription =
    !hasFullAccess && !isBusinessOwner && (!isEmployee || !companySubscriptionActive);
  const needsBusinessSubscription =
    isBusinessOwner && !companySubscriptionActive;

  let message: string | undefined;
  if (!canCreateRecipe) {
    message = `Gratis account: maximaal ${FREE_RECIPE_LIMIT} recepten. Upgrade voor onbeperkt toegang.`;
  }

  return {
    enforcementEnabled,
    testMode,
    mollieConfigured,
    tier,
    hasFullAccess,
    canCreateRecipe,
    recipeLimit: hasFullAccess ? null : FREE_RECIPE_LIMIT,
    personalRecipeCount,
    needsPersonalSubscription,
    needsBusinessSubscription,
    isBusinessOwner,
    isEmployee,
    employeeCount,
    companySubscriptionActive,
    personalSubscriptionStatus: personalStatus,
    businessSubscriptionStatus: companySub?.status ?? null,
    waivedByCompanyId: userSub?.waivedByCompanyId ?? null,
    companyId,
    message,
  };
}

export async function loadUserForBilling(userId: string) {
  return safeDbOperation(async (prisma) =>
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompany: { select: { id: true, status: true } },
        companyMemberships: {
          include: { company: { select: { id: true } } },
        },
        userSubscription: true,
      },
    })
  );
}
