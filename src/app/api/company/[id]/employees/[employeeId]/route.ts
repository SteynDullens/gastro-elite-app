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

      // Get company and verify ownership
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          owner: {
            select: { id: true, email: true }
          }
        }
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Verify requester is the company owner
      if (company.ownerId !== decodedToken.id) {
        console.error('❌ Unauthorized: Only company owner can remove employees', {
          requesterId: decodedToken.id,
          ownerId: company.ownerId
        });
        throw new Error('Unauthorized: Only company owner can remove employees');
      }

      // Verify the employee belongs to this company
      // Check both legacy companyId and CompanyMembership
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        include: {
          companyMemberships: {
            where: { companyId: companyId }
          }
        }
      });

      console.log('🔍 Found employee:', { 
        found: !!employee, 
        employeeId, 
        employeeCompanyId: employee?.companyId, 
        requestedCompanyId: companyId,
        hasMembership: (employee?.companyMemberships?.length ?? 0) > 0
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if employee belongs to this company (legacy or membership)
      const belongsToCompany = 
        employee.companyId === companyId || 
        (employee.companyMemberships && employee.companyMemberships.length > 0);

      if (!belongsToCompany) {
        console.error('❌ Employee company mismatch:', {
          employeeCompanyId: employee.companyId,
          requestedCompanyId: companyId,
          memberships: employee.companyMemberships?.map(m => m.companyId)
        });
        throw new Error('Employee does not belong to this company');
      }

      // CRITICAL: Reassign all company recipes created by this employee to the company owner
      // This ensures recipes remain company property and former employee loses all control
      console.log('🔄 Reassigning company recipes created by employee to company owner...');
      
      const recipesToReassign = await prisma.companyRecipe.findMany({
        where: {
          companyId: companyId,
          creatorId: employeeId
        },
        select: {
          id: true,
          name: true
        }
      });

      console.log(`📋 Found ${recipesToReassign.length} company recipes to reassign`, {
        recipeIds: recipesToReassign.map(r => r.id),
        recipeNames: recipesToReassign.map(r => r.name)
      });

      if (recipesToReassign.length > 0) {
        const reassignResult = await prisma.companyRecipe.updateMany({
          where: {
            companyId: companyId,
            creatorId: employeeId
          },
          data: {
            creatorId: company.ownerId // Reassign to company owner
          }
        });

        console.log(`✅ Reassigned ${reassignResult.count} company recipes to company owner`, {
          fromEmployeeId: employeeId,
          toOwnerId: company.ownerId,
          companyId: companyId
        });
      }

      // Remove employee from CompanyMembership (many-to-many)
      if (employee.companyMemberships && employee.companyMemberships.length > 0) {
        await prisma.companyMembership.deleteMany({
          where: {
            userId: employeeId,
            companyId: companyId
          }
        });
        console.log('✅ Removed employee from CompanyMembership');
      }

      // Remove employee from legacy companyId (backward compatibility)
      if (employee.companyId === companyId) {
        const updatedUser = await prisma.user.update({
          where: { id: employeeId },
          data: { companyId: null },
          select: {
            id: true,
            email: true,
            companyId: true
          }
        });

        console.log('✅ Removed employee from legacy companyId:', {
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
      }
      
      return { 
        success: true,
        recipesReassigned: recipesToReassign.length,
        employeeEmail: employee.email
      };
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
