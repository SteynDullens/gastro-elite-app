import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const { id: companyId, invitationId } = await params;
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const result = await safeDbOperation(async (prisma) => {
      if (!prisma) {
        throw new Error('Database connection not available');
      }

      // Check if EmployeeInvitation model exists
      try {
        // Verify the invitation belongs to this company
        const invitation = await prisma.employeeInvitation.findUnique({
          where: { id: invitationId },
          include: {
            company: true,
            invitedUser: {
              select: {
                id: true,
                companyId: true
              }
            }
          }
        });

        if (!invitation) {
          throw new Error('Invitation not found');
        }

        if (invitation.companyId !== companyId) {
          throw new Error('Invitation does not belong to this company');
        }

        // If invitation has an invitedUser and they are linked to this company, remove the link
        // This handles both pending invitations (where user might already be linked) and accepted ones
        if (invitation.invitedUserId && invitation.invitedUser) {
          // Check if user is actually linked to this company
          if (invitation.invitedUser.companyId === companyId) {
            await prisma.user.update({
              where: { id: invitation.invitedUserId },
              data: { companyId: null }
            });
            console.log('✅ Removed user company link:', invitation.invitedUserId);
          }
        }

        // Delete invitation
        await prisma.employeeInvitation.delete({
          where: { id: invitationId }
        });

        console.log('✅ Invitation deleted:', invitationId);
        return { success: true };
      } catch (error: any) {
        // If table doesn't exist (P2021), handle gracefully
        if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('P2021')) {
          console.warn('⚠️ EmployeeInvitation table does not exist (P2021) - migration may not have been run');
          return { success: false, error: 'Invitation system not available - database migration required. Please run: npx prisma migrate deploy' };
        }
        throw error;
      }
    });

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.error || 'Database operation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove invitation' },
      { status: 500 }
    );
  }
}

