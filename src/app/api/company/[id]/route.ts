import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    
    const result = await safeDbOperation(async (prisma) => {
      if (!prisma) {
        throw new Error('Database connection not available');
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!company) {
        return null;
      }

      return company;
    });

    if (result === null) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company' },
      { status: 500 }
    );
  }
}








