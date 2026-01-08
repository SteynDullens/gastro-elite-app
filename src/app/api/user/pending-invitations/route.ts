import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.id || decodedToken.userId;

    const result = await safeDbOperation(async (prisma) => {
      // Find pending invitations for this user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (!user) {
        return [];
      }

      // Get pending invitations for this user (by email OR by invitedUserId)
      const invitations = await prisma.employeeInvitation.findMany({
        where: {
          OR: [
            { email: user.email.toLowerCase().trim() },
            { invitedUserId: userId }
          ],
          status: 'pending'
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return invitations.map(inv => ({
        id: inv.id,
        companyId: inv.companyId,
        companyName: inv.company.name,
        email: inv.email,
        createdAt: inv.createdAt
      }));
    });

    return NextResponse.json({ invitations: result || [] });
  } catch (error: any) {
    console.error('Error fetching pending invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending invitations' },
      { status: 500 }
    );
  }
}

