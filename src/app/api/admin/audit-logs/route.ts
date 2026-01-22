import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAuditLogs } from '@/lib/audit';

export async function GET(request: NextRequest) {
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
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = await getAuditLogs({
      action: action || undefined,
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      userId: userId || undefined,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      logs: logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null
      }))
    });

  } catch (error: any) {
    console.error('❌ Failed to fetch audit logs:', error);
    return NextResponse.json({
      error: 'Failed to fetch audit logs',
      message: error.message
    }, { status: 500 });
  }
}

