import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sendAccountDeletionNotification } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit';

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !decodedToken.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await safeDbOperation(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          ownedCompany: true,
          personalRecipes: true,
          companyRecipesCreated: true,
          companyMemberships: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.deletedAt) {
        throw new Error('Gebruiker is al verwijderd');
      }

      if (user.id === decodedToken.id) {
        throw new Error('Je kunt je eigen admin-account niet verwijderen');
      }

      const ownedCompanyId = user.ownedCompany?.id;

      // Los company recipes van deze maker
      if (user.companyRecipesCreated.length > 0) {
        await prisma.companyRecipe.updateMany({
          where: { creatorId: user.id },
          data: { creatorId: null }
        });
      }

      // Eigen memberships weg
      if (user.companyMemberships.length > 0) {
        await prisma.companyMembership.deleteMany({
          where: { userId: user.id }
        });
      }

      // Bedrijf van deze eigenaar: alle koppelingen losmaken vóór soft-delete
      if (ownedCompanyId) {
        await prisma.user.updateMany({
          where: { companyId: ownedCompanyId },
          data: { companyId: null }
        });
        await prisma.companyMembership.deleteMany({
          where: { companyId: ownedCompanyId }
        });
        await prisma.employeeInvitation.deleteMany({
          where: { companyId: ownedCompanyId }
        });
      }

      // Als employee bij ander bedrijf: companyId op user legen
      if (user.companyId && user.companyId !== ownedCompanyId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { companyId: null }
        });
      }

      const userEmail = user.email;
      const firstName = user.firstName;
      const lastName = user.lastName;

      // Soft-delete persoonlijke recepten
      await prisma.personalRecipe.updateMany({
        where: { userId: user.id, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletedBy: decodedToken.id
        }
      });

      // Soft-delete gebruiker
      await prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          deletedBy: decodedToken.id,
          companyId: null
        }
      });

      // Soft-delete eigen bedrijf (record blijft bestaan voor recepten / historie)
      if (ownedCompanyId) {
        await prisma.company.update({
          where: { id: ownedCompanyId },
          data: {
            deletedAt: new Date(),
            deletedBy: decodedToken.id
          }
        });
      }

      // Log audit event
      await logAuditEvent({
        action: 'soft_delete',
        entityType: 'User',
        entityId: user.id,
        userId: decodedToken.id,
        userEmail: decodedToken.email,
        details: {
          deletedUser: userEmail,
          deletedUserName: `${firstName} ${lastName}`,
          personalRecipesCount: user.personalRecipes.length,
          companyRecipesCount: user.companyRecipesCreated.length,
          ownedCompany: user.ownedCompany?.name
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      });

      // Send email notification
      try {
        await sendAccountDeletionNotification(userEmail, firstName, lastName);
        console.log(`✅ Account deletion email sent to ${userEmail}`);
      } catch (emailError) {
        console.error('Error sending account deletion email:', emailError);
        // Don't fail the request if email fails
      }

      return { success: true, deletedUser: { email: userEmail, id: user.id }, softDelete: true };
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Database niet beschikbaar of verwijderen mislukt.' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

