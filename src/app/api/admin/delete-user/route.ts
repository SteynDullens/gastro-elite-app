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
      // Check if user exists and get related data
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

      // Delete related data first
      // Delete personal recipes (cascade should handle this, but being explicit)
      if (user.personalRecipes.length > 0) {
        await prisma.personalRecipe.deleteMany({
          where: { userId: user.id }
        });
      }

      // Update company recipes: remove creator reference (company still owns them)
      if (user.companyRecipesCreated.length > 0) {
        await prisma.companyRecipe.updateMany({
          where: { creatorId: user.id },
          data: { creatorId: null }
        });
      }

      // Remove company memberships
      if (user.companyMemberships.length > 0) {
        await prisma.companyMembership.deleteMany({
          where: { userId: user.id }
        });
      }

      // Delete owned company if exists
      if (user.ownedCompany) {
        await prisma.company.delete({
          where: { id: user.ownedCompany.id }
        });
      }

      // Remove from company employees if applicable
      if (user.companyId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { companyId: null }
        });
      }

      // Store user info for email notification before deletion
      const userEmail = user.email;
      const firstName = user.firstName;
      const lastName = user.lastName;

      // Soft delete: Mark as deleted instead of actually deleting
      await prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          deletedBy: decodedToken.id
        }
      });

      // Soft delete personal recipes
      if (user.personalRecipes.length > 0) {
        await prisma.personalRecipe.updateMany({
          where: { userId: user.id, deletedAt: null },
          data: {
            deletedAt: new Date(),
            deletedBy: decodedToken.id
          }
        });
      }

      // Soft delete owned company
      if (user.ownedCompany) {
        await prisma.company.update({
          where: { id: user.ownedCompany.id },
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

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

