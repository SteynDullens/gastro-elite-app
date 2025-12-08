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
            company: true
          }
        });

        if (!invitation) {
          throw new Error('Invitation not found');
        }

        if (invitation.companyId !== companyId) {
          throw new Error('Invitation does not belong to this company');
        }

        // If invitation was accepted and user is linked, remove the link
        if (invitation.status === 'accepted' && invitation.invitedUserId) {
          await prisma.user.update({
            where: { id: invitation.invitedUserId },
            data: { companyId: null }
          });
        }

        // Delete invitation
        await prisma.employeeInvitation.delete({
          where: { id: invitationId }
        });

        return { success: true };
      } catch (error: any) {
        // If table doesn't exist (P2021), handle gracefully
        if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('P2021')) {
          console.warn('⚠️ EmployeeInvitation table does not exist (P2021) - migration may not have been run');
          // Try to find user by email and remove company link instead
          console.log('Attempting to remove user company link as fallback...');
          
          // We can't find the invitation, but we can try to find the user by checking employees
          // This is a fallback - ideally the migration should be run
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

