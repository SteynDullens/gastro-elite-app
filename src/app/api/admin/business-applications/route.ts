import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sendBusinessApprovalNotification, sendBusinessRejectionNotification } from '@/lib/email';

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
              phone: true,
              emailVerified: true,
              emailVerifiedAt: true
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
      vat_number: app.vatNumber || '',
      kvk_number: app.kvkNumber,
      company_phone: app.companyPhone || '',
      address: app.address,
      contact_name: `${app.owner.firstName} ${app.owner.lastName}`,
      contact_phone: app.owner.phone || '',
      contact_email: app.owner.email,
      kvk_document_path: app.kvkDocumentPath || '',
      kvk_document_data: app.kvkDocumentData || '', // Include base64 data if available
      status: app.status,
      rejection_reason: app.rejectionReason || '',
      approved_at: app.approvedAt?.toISOString() || null,
      approved_by: app.approvedBy || null,
      email_verified: app.owner.emailVerified,
      email_verified_at: app.owner.emailVerifiedAt?.toISOString() || null,
      createdAt: app.createdAt.toISOString(),
      ownerEmail: app.owner.email,
      ownerFirstName: app.owner.firstName,
      ownerLastName: app.owner.lastName
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

    // Get company and owner info for email notification
    const company = await safeDbOperation(async (prisma) => {
      return await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          owner: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              emailVerified: true
            }
          }
        }
      });
    });

    if (!company) {
      return NextResponse.json({ message: 'Company not found' }, { status: 404 });
    }

    // Check email verification for approval
    if (status === 'approved' && !company.owner.emailVerified) {
      return NextResponse.json({ 
        message: 'Kan niet goedkeuren: de eigenaar heeft het e-mailadres nog niet geverifieerd.' 
      }, { status: 400 });
    }

    // Update company status using Prisma
    const isApproved = status === 'approved';
    await safeDbOperation(async (prisma) => {
      return await prisma.company.update({
      where: { id: companyId },
      data: {
          status: isApproved ? 'approved' : 'rejected',
          rejectionReason: isApproved ? null : (rejectionReason || null),
          approvedAt: isApproved ? new Date() : null,
          approvedBy: decodedToken.email || decodedToken.id
      }
    });
    });

    // Send email notification to the business owner
    const userName = `${company.owner.firstName} ${company.owner.lastName}`;
    try {
      if (isApproved) {
        await sendBusinessApprovalNotification(
          company.owner.email,
          company.name,
          userName
        );
        console.log(`✅ Approval email sent to ${company.owner.email}`);
      } else {
        await sendBusinessRejectionNotification(
          company.owner.email,
          company.name,
          userName,
          rejectionReason
        );
        console.log(`✅ Rejection email sent to ${company.owner.email}`);
      }
    } catch (emailError) {
      console.error('Error sending status notification email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      message: `Company application ${status} successfully`,
      emailSent: true
    });
  } catch (error) {
    console.error('Error updating business application status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
