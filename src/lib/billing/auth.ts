import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { loadUserForBilling } from "./access";

export async function getAuthenticatedBillingUser(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded?.id) return null;
  const user = await loadUserForBilling(decoded.id);
  if (!user || user.isBlocked) return null;
  return user;
}
