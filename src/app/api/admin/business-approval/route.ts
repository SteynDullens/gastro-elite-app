import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendBusinessApprovalNotification, sendBusinessRejectionNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { companyId, action, reason } = await request.json();

    if (!companyId || !action) {
      return NextResponse.json(
        { error: 'Company ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Find the company and its owner
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        owner: true
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    if (!company.owner) {
      return NextResponse.json(
        { error: 'Company owner not found' },
        { status: 404 }
      );
    }

    // Update company status
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected'
      }
    });

    // Send email notification
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        if (action === 'approve') {
          await sendBusinessApprovalNotification(
            company.owner.email,
            company.name,
            `${company.owner.firstName} ${company.owner.lastName}`
          );
        } else {
          await sendBusinessRejectionNotification(
            company.owner.email,
            company.name,
            `${company.owner.firstName} ${company.owner.lastName}`,
            reason
          );
        }
      }
    } catch (emailError) {
      console.error('Error sending business approval/rejection email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Business account ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        status: updatedCompany.status
      }
    });

  } catch (error) {
    console.error('Business approval/rejection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


