import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !decodedToken.isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const applications = await safeDbOperation(async (prisma) => {
      return await prisma.company.findMany({
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
              email: true,
              phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    });

    if (!applications) {
      return NextResponse.json([]);
    }

    // Transform to match the expected format
    const transformedApplications = applications.map(app => ({
      id: app.id,
      company_name: app.name,
      vat_number: (app as any).vatNumber || '',
      kvk_number: app.kvkNumber,
      address: app.address,
      contact_name: `${app.owner.firstName} ${app.owner.lastName}`,
      contact_phone: app.owner.phone || '',
      contact_email: app.owner.email,
      kvk_document_path: (app as any).kvkDocumentPath || '',
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      ownerEmail: app.owner.email,
      ownerFirstName: app.owner.firstName
    }));

    return NextResponse.json(transformedApplications);
  } catch (error) {
    console.error('Error fetching business applications:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !decodedToken.isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { companyId, status, rejectionReason } = await request.json();

    if (!companyId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    // Update company status using Prisma
    await safeDbOperation(async (prisma) => {
      return await prisma.company.update({
      where: { id: companyId },
      data: {
        status: status === 'approved' ? 'approved' : 'rejected'
      }
      });
    });

    return NextResponse.json({ message: `Company application ${status} successfully` });
  } catch (error) {
    console.error('Error updating business application status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
