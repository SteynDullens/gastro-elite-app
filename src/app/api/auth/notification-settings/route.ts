import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ error: 'Ongeldige sessie' }, { status: 401 });
    }

    const body = await request.json();
    const { pushNotifications, emailNotifications } = body;

    if (typeof pushNotifications !== 'boolean' || typeof emailNotifications !== 'boolean') {
      return NextResponse.json(
        { error: 'Ongeldige notificatie-instellingen' },
        { status: 400 }
      );
    }

    const updated = await safeDbOperation(async (prisma) =>
      prisma.user.update({
        where: { id: decoded.id },
        data: { pushNotifications, emailNotifications },
        select: {
          pushNotifications: true,
          emailNotifications: true,
        },
      })
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Kon notificatie-instellingen niet opslaan.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: updated,
    });
  } catch (error) {
    console.error('Notification settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
