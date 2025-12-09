import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

// GET - List pending business applications
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const pendingApplications = await safeDbOperation(async (prisma) => {
      return await prisma.company.findMany({
        where: { status: 'pending' },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    return NextResponse.json({ applications: pendingApplications || [] });
  } catch (error: any) {
    console.error('Error fetching business applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// POST - Approve or reject a business application
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { companyId, action } = await request.json();
    
    if (!companyId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const updatedCompany = await safeDbOperation(async (prisma) => {
      return await prisma.company.update({
        where: { id: companyId },
        data: { status: newStatus }
      });
    });

    return NextResponse.json({ 
      success: true, 
      company: updatedCompany,
      message: `Business application ${action}d successfully`
    });
  } catch (error: any) {
    console.error('Error updating business application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}