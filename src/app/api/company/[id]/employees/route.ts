import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { 
  sendEmployeeInvitationToExistingUser, 
  sendEmployeeInvitationToNewUser 
} from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const employees = await safeDbOperation(async (prisma) => {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          employees: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              createdAt: true
            }
          }
        }
      });

      if (!company) {
        return null;
      }

      return company.employees.map(employee => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        status: 'accepted', // Since they're linked, they're accepted
        createdAt: employee.createdAt
      }));
    });

    if (employees === null) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const { email, language } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get company and owner info
    const result = await safeDbOperation(async (prisma) => {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          owner: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          employees: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: {
          ownedCompany: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (existingUser) {
        // User exists - check if they're already an employee
        const isAlreadyEmployee = company.employees.some(emp => emp.id === existingUser.id);
        
        if (isAlreadyEmployee) {
          throw new Error('Deze gebruiker is al lid van uw team');
        }

        // Check if user owns a business account
        if (existingUser.ownedCompany) {
          throw new Error('Deze gebruiker heeft al een bedrijfsaccount en kan niet als medewerker worden toegevoegd');
        }

        // Link user to company (personal account joining as employee)
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { companyId: company.id }
        });

        // Send invitation email to existing user
        const employeeName = `${existingUser.firstName} ${existingUser.lastName}`;
        const ownerName = `${company.owner.firstName} ${company.owner.lastName}`;
        const userLanguage = language || 'nl';
        
        await sendEmployeeInvitationToExistingUser(
          email,
          employeeName,
          company.name,
          ownerName,
          userLanguage
        );

        return {
          success: true,
          message: 'Uitnodiging verzonden naar bestaande gebruiker',
          userExists: true
        };
      } else {
        // User doesn't exist - send registration invitation
        const ownerName = `${company.owner.firstName} ${company.owner.lastName}`;
        const userLanguage = language || 'nl';
        
        await sendEmployeeInvitationToNewUser(
          email,
          company.name,
          ownerName,
          userLanguage
        );

        return {
          success: true,
          message: 'Registratie-uitnodiging succesvol verzonden',
          userExists: false
        };
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error adding employee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add employee' },
      { status: 500 }
    );
  }
}
