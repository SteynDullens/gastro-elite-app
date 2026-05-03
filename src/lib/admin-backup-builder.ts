import type { PrismaClient } from "@prisma/client";

export type AdminBackupType = "all" | "recipes" | "users" | "companies";

export async function buildAdminBackupPayload(
  prisma: PrismaClient,
  type: AdminBackupType
): Promise<{
  version: string;
  timestamp: string;
  type: AdminBackupType;
  data: Record<string, unknown>;
}> {
  const backup: {
    version: string;
    timestamp: string;
    type: AdminBackupType;
    data: Record<string, unknown>;
  } = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    type,
    data: {},
  };

  if (type === "all" || type === "users") {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isBlocked: true,
        isAdmin: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    backup.data.users = users;
  }

  if (type === "all" || type === "recipes") {
    const personalRecipes = await prisma.personalRecipe.findMany({
      include: {
        ingredients: true,
        categories: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const companyRecipes = await prisma.companyRecipe.findMany({
      include: {
        ingredients: true,
        categories: true,
        company: {
          select: {
            id: true,
            name: true,
            kvkNumber: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    backup.data.recipes = {
      personal: personalRecipes,
      company: companyRecipes,
    };
  }

  if (type === "all" || type === "companies") {
    const companies = await prisma.company.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
    backup.data.companies = companies;
  }

  return backup;
}

/** Calendar date YYYY-MM-DD in Europe/Amsterdam (for one backup per local day). */
export function getAmsterdamDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatBackupLabelNl(dateKey: string): string {
  const [y, m, d] = dateKey.split("-");
  if (!y || !m || !d) return `Back-up ${dateKey}`;
  return `Back-up ${d}-${m}-${y}`;
}
