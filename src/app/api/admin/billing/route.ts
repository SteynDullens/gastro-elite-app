import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { safeDbOperation } from "@/lib/prisma";
import { formatSubscriptionForAdmin } from "@/lib/billing/subscription-label";
import { isTestPaymentsMode } from "@/lib/billing/constants";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const decoded = verifyToken(token);
  if (!decoded?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const data = await safeDbOperation(async (prisma) => {
    const userSubs = await prisma.userSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isAdmin: true,
            companyId: true,
            ownedCompany: {
              select: {
                id: true,
                name: true,
                status: true,
                companySubscription: true,
              },
            },
            companyMemberships: {
              include: { company: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const companySubs = await prisma.companySubscription.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
            owner: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const payments = await prisma.billingPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { email: true } },
        company: { select: { name: true } },
      },
    });

    const invoices = await prisma.subscriptionInvoice.findMany({
      orderBy: { issuedAt: "desc" },
      take: 50,
      select: {
        id: true,
        invoiceNumber: true,
        buyerEmail: true,
        buyerName: true,
        amountInclVat: true,
        planType: true,
        issuedAt: true,
        emailSentAt: true,
        molliePaymentId: true,
      },
    });

    const activePersonal = userSubs.filter(
      (s) => s.status === "active" && s.plan === "personal"
    ).length;
    const waived = userSubs.filter((s) => s.status === "waived").length;
    const activeBusiness = companySubs.filter((s) => s.status === "active").length;
    const paidPayments = payments.filter((p) => p.status === "paid").length;

    return {
      userSubs,
      companySubs,
      payments,
      invoices,
      activePersonal,
      waived,
      activeBusiness,
      paidPayments,
    };
  });

  if (!data) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const subscribers = data.userSubs.map((s) => {
    const u = s.user;
    const membership = u.companyMemberships?.[0];
    const summary = formatSubscriptionForAdmin({
      isAdmin: u.isAdmin,
      ownedCompany: u.ownedCompany,
      companyId: u.companyId,
      companyMemberships: u.companyMemberships,
      userSubscription: s,
      companySubscription: u.ownedCompany?.companySubscription ?? null,
      employerCompanyName: membership?.company?.name ?? null,
    });
    return {
      userId: u.id,
      email: u.email,
      name: `${u.firstName} ${u.lastName}`.trim(),
      subscription: summary,
      raw: {
        plan: s.plan,
        status: s.status,
        mollieSubscriptionId: s.mollieSubscriptionId,
        currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
      },
    };
  });

  return NextResponse.json({
    success: true,
    testMode: isTestPaymentsMode(),
    summary: {
      activePersonal: data.activePersonal,
      activeBusiness: data.activeBusiness,
      employeeWaived: data.waived,
      paidPayments: data.paidPayments,
      totalUserSubscriptionRows: data.userSubs.length,
      totalCompanySubscriptionRows: data.companySubs.length,
    },
    subscribers,
    companySubscriptions: data.companySubs.map((cs) => ({
      companyId: cs.companyId,
      companyName: cs.company.name,
      ownerEmail: cs.company.owner.email,
      status: cs.status,
      monthlyAmount: cs.monthlyAmount,
      billedEmployeeCount: cs.billedEmployeeCount,
      mollieSubscriptionId: cs.mollieSubscriptionId,
      currentPeriodEnd: cs.currentPeriodEnd?.toISOString() ?? null,
    })),
    invoices: data.invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      buyerName: inv.buyerName,
      buyerEmail: inv.buyerEmail,
      planType: inv.planType,
      amountInclVat: inv.amountInclVat,
      issuedAt: inv.issuedAt.toISOString(),
      emailSent: Boolean(inv.emailSentAt),
      molliePaymentId: inv.molliePaymentId,
    })),
    recentPayments: data.payments.map((p) => ({
      id: p.id,
      molliePaymentId: p.molliePaymentId,
      kind: p.kind,
      status: p.status,
      amount: p.amount,
      userEmail: p.user?.email ?? null,
      companyName: p.company?.name ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
