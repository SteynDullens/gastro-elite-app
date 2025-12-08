import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const { id: companyId, employeeId } = await params;
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await safeDbOperation(async (prisma) => {
      // Verify the employee belongs to this company
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        include: {
          company: true
        }
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      if (employee.companyId !== companyId) {
        throw new Error('Employee does not belong to this company');
      }

      // Remove employee from company
      await prisma.user.update({
        where: { id: employeeId },
        data: { companyId: null }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove employee' },
      { status: 500 }
    );
  }
}
