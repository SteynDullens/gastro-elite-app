import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

function getAuthUserId(request: NextRequest): string | null {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return decoded.id || decoded.userId || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await safeDbOperation(async (prisma) => {
      const [notifications, unreadCount] = await Promise.all([
        prisma.appNotification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        prisma.appNotification.count({
          where: { userId, readAt: null },
        }),
      ]);
      return { notifications, unreadCount };
    });

    return NextResponse.json(result ?? { notifications: [], unreadCount: 0 });
  } catch (e) {
    console.error('GET /api/notifications:', e);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { markAllRead?: boolean; ids?: string[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const now = new Date();

    await safeDbOperation(async (prisma) => {
      if (body.markAllRead) {
        await prisma.appNotification.updateMany({
          where: { userId, readAt: null },
          data: { readAt: now },
        });
      } else if (Array.isArray(body.ids) && body.ids.length > 0) {
        await prisma.appNotification.updateMany({
          where: { userId, id: { in: body.ids } },
          data: { readAt: now },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PATCH /api/notifications:', e);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
