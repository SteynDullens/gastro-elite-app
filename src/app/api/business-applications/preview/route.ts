import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get pending business applications for preview
    const applications = await prisma.company.findMany({
      where: {
        status: 'pending'
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5 // Limit to 5 most recent applications
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching business applications preview:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}



