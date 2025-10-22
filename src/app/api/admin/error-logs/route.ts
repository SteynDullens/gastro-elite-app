import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getErrorLogs, logError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const logs = await getErrorLogs(limit, offset);

    return NextResponse.json({
      success: true,
      logs
    });

  } catch (error: any) {
    await logError({
      level: 'error',
      message: `Failed to fetch error logs: ${error.message}`,
      url: request.url,
      method: 'GET'
    });

    return NextResponse.json(
      { error: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}

