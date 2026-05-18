import type { PrismaClient } from "@prisma/client";

/** Aantal werknemers (excl. eigenaar) gekoppeld aan bedrijf */
export async function countCompanyEmployees(
  prisma: PrismaClient,
  companyId: string,
  ownerId: string
): Promise<number> {
  const legacy = await prisma.user.count({
    where: {
      companyId,
      id: { not: ownerId },
      deletedAt: null,
    },
  });

  const membershipUserIds = await prisma.companyMembership.findMany({
    where: { companyId, userId: { not: ownerId } },
    select: { userId: true },
  });

  const legacyIds = await prisma.user.findMany({
    where: { companyId, id: { not: ownerId } },
    select: { id: true },
  });

  const ids = new Set<string>();
  for (const u of legacyIds) ids.add(u.id);
  for (const m of membershipUserIds) ids.add(m.userId);

  return Math.max(legacy, ids.size);
}
