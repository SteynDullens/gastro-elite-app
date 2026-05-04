import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { sendAccountDeletionNotification } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decodedToken = verifyToken(token);
  if (!decodedToken || !decodedToken.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Database niet bereikbaar (Prisma). Controleer DATABASE_URL of DEV_MODE_NO_DB.",
      },
      { status: 503 }
    );
  }

  try {
    const payload = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: {
            ownedCompany: true,
            personalRecipes: true,
            companyRecipesCreated: true,
            companyMemberships: true,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }
        if (user.deletedAt) {
          throw new Error("Gebruiker is al verwijderd");
        }
        if (user.id === decodedToken.id) {
          throw new Error("Je kunt je eigen admin-account niet verwijderen");
        }

        const ownedCompanyId = user.ownedCompany?.id;

        if (user.companyRecipesCreated.length > 0) {
          await tx.companyRecipe.updateMany({
            where: { creatorId: user.id },
            data: { creatorId: null },
          });
        }

        if (user.companyMemberships.length > 0) {
          await tx.companyMembership.deleteMany({
            where: { userId: user.id },
          });
        }

        if (ownedCompanyId) {
          await tx.user.updateMany({
            where: { companyId: ownedCompanyId },
            data: { companyId: null },
          });
          await tx.companyMembership.deleteMany({
            where: { companyId: ownedCompanyId },
          });
          await tx.employeeInvitation.deleteMany({
            where: { companyId: ownedCompanyId },
          });
        }

        if (user.companyId && user.companyId !== ownedCompanyId) {
          await tx.user.update({
            where: { id: user.id },
            data: { companyId: null },
          });
        }

        await tx.personalRecipe.updateMany({
          where: { userId: user.id, deletedAt: null },
          data: {
            deletedAt: new Date(),
            deletedBy: String(decodedToken.id),
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            deletedAt: new Date(),
            deletedBy: String(decodedToken.id),
            companyId: null,
          },
        });

        if (ownedCompanyId) {
          await tx.company.update({
            where: { id: ownedCompanyId },
            data: {
              deletedAt: new Date(),
              deletedBy: String(decodedToken.id),
            },
          });
        }

        return {
          userEmail: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          id: user.id,
          personalRecipesCount: user.personalRecipes.length,
          companyRecipesCount: user.companyRecipesCreated.length,
          ownedCompanyName: user.ownedCompany?.name,
        };
      },
      { maxWait: 10_000, timeout: 25_000 }
    );

    await logAuditEvent({
      action: "soft_delete",
      entityType: "User",
      entityId: payload.id,
      userId: String(decodedToken.id),
      userEmail: decodedToken.email,
      details: {
        deletedUser: payload.userEmail,
        deletedUserName: `${payload.firstName} ${payload.lastName}`,
        personalRecipesCount: payload.personalRecipesCount,
        companyRecipesCount: payload.companyRecipesCount,
        ownedCompany: payload.ownedCompanyName,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    try {
      await sendAccountDeletionNotification(
        payload.userEmail,
        payload.firstName,
        payload.lastName
      );
    } catch (emailError) {
      console.error("Error sending account deletion email:", emailError);
    }

    return NextResponse.json({
      success: true,
      deletedUser: { email: payload.userEmail, id: payload.id },
      softDelete: true,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Verwijderen mislukt";
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
