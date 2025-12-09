import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const { id: companyId, employeeId } = await params;
    
    console.log('🗑️ DELETE employee request:', { companyId, employeeId });
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const result = await safeDbOperation(async (prisma) => {
      if (!prisma) {
        throw new Error('Database connection not available');
      }

      // Verify the employee belongs to this company
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        include: {
          company: true
        }
      });

      console.log('🔍 Found employee:', { 
        found: !!employee, 
        employeeId, 
        employeeCompanyId: employee?.companyId, 
        requestedCompanyId: companyId 
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      if (employee.companyId !== companyId) {
        console.error('❌ Employee company mismatch:', {
          employeeCompanyId: employee.companyId,
          requestedCompanyId: companyId
        });
        throw new Error('Employee does not belong to this company');
      }

      // Remove employee from company
      const updatedUser = await prisma.user.update({
        where: { id: employeeId },
        data: { companyId: null },
        select: {
          id: true,
          email: true,
          companyId: true
        }
      });

      console.log('✅ Employee removed successfully:', {
        employeeId,
        email: updatedUser.email,
        companyIdAfterUpdate: updatedUser.companyId,
        shouldBeNull: updatedUser.companyId === null
      });
      
      // Verify the update worked
      if (updatedUser.companyId !== null) {
        console.error('❌ WARNING: Employee companyId was not set to null!', {
          employeeId,
          companyId: updatedUser.companyId
        });
        throw new Error('Failed to remove employee - companyId still set');
      }
      
      return { success: true };
    });

    if (!result) {
      console.error('❌ Database operation returned null');
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error removing employee:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    return NextResponse.json(
      { error: error.message || 'Failed to remove employee' },
      { status: 500 }
    );
  }
}
