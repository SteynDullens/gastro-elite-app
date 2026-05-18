import { NextRequest, NextResponse } from "next/server";
import { getBillingAccessForUser } from "@/lib/billing/access";
import { getAuthenticatedBillingUser } from "@/lib/billing/auth";
import {
  FREE_RECIPE_LIMIT,
  PRICE_BUSINESS_BASE,
  PRICE_EXTRA_EMPLOYEE,
  PRICE_PERSONAL_MONTHLY,
  calculateBusinessMonthlyAmount,
} from "@/lib/billing/constants";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedBillingUser(request);
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const access = await getBillingAccessForUser(user);
  const businessMonthly = user.ownedCompany
    ? calculateBusinessMonthlyAmount(access.employeeCount)
    : null;

  return NextResponse.json({
    success: true,
    access,
    pricing: {
      freeRecipeLimit: FREE_RECIPE_LIMIT,
      personalMonthly: PRICE_PERSONAL_MONTHLY,
      businessBase: PRICE_BUSINESS_BASE,
      extraEmployee: PRICE_EXTRA_EMPLOYEE,
      businessMonthly,
    },
  });
}
