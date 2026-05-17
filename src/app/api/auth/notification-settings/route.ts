import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

/** Notification preferences are not persisted yet — do not fake success. */
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

    await request.json();

    return NextResponse.json(
      {
        error:
          'Notificatie-instellingen worden binnenkort opgeslagen. Deze optie is nog niet gekoppeld aan de database.',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Notification settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
