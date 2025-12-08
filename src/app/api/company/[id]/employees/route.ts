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

    const result = await safeDbOperation(async (prisma) => {
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
          },
          invitations: {
            include: {
              invitedUser: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!company) {
        return null;
      }

      // Combine employees and pending invitations
      const employeeList = company.employees.map(employee => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        status: 'accepted' as const,
        createdAt: employee.createdAt,
        invitationId: null
      }));

      // Add pending invitations that don't have a user yet
      const pendingInvitations = company.invitations
        .filter(inv => inv.status === 'pending' && !inv.invitedUser)
        .map(inv => ({
          id: inv.id,
          firstName: null,
          lastName: null,
          email: inv.email,
          phone: null,
          status: 'pending' as const,
          createdAt: inv.createdAt,
          invitationId: inv.id
        }));

      return [...employeeList, ...pendingInvitations];
    });

    if (result === null) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ employees: result });
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

    const userId = decodedToken.userId;

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
          },
          invitations: {
            where: {
              email: email.toLowerCase().trim(),
              status: 'pending'
            }
          }
        }
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Check if invitation already exists
      if (company.invitations.length > 0) {
        throw new Error('Er is al een uitnodiging verzonden naar dit e-mailadres');
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          ownedCompany: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      let emailSent = false;
      let emailError: string | null = null;

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

        // Create invitation record
        const invitation = await prisma.employeeInvitation.create({
          data: {
            email: email.toLowerCase().trim(),
            companyId: company.id,
            invitedBy: userId,
            invitedUserId: existingUser.id,
            status: 'pending'
          }
        });

        // Link user to company (personal account joining as employee)
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { companyId: company.id }
        });

        // Update invitation to accepted
        await prisma.employeeInvitation.update({
          where: { id: invitation.id },
          data: { status: 'accepted' }
        });

        // Send invitation email to existing user
        try {
          const employeeName = `${existingUser.firstName} ${existingUser.lastName}`;
          const ownerName = `${company.owner.firstName} ${company.owner.lastName}`;
          const userLanguage = language || 'nl';
          
          emailSent = await sendEmployeeInvitationToExistingUser(
            email,
            employeeName,
            company.name,
            ownerName,
            userLanguage
          );

          if (!emailSent) {
            emailError = 'E-mail kon niet worden verzonden, maar gebruiker is toegevoegd';
          }
        } catch (emailErr: any) {
          console.error('Email sending error:', emailErr);
          emailError = `E-mail fout: ${emailErr.message}`;
        }

        return {
          success: true,
          message: emailSent 
            ? 'Uitnodiging verzonden naar bestaande gebruiker' 
            : 'Gebruiker toegevoegd, maar e-mail kon niet worden verzonden',
          userExists: true,
          emailSent,
          emailError
        };
      } else {
        // User doesn't exist - create invitation record
        const invitation = await prisma.employeeInvitation.create({
          data: {
            email: email.toLowerCase().trim(),
            companyId: company.id,
            invitedBy: userId,
            status: 'pending'
          }
        });

        // Send registration invitation
        try {
          const ownerName = `${company.owner.firstName} ${company.owner.lastName}`;
          const userLanguage = language || 'nl';
          
          emailSent = await sendEmployeeInvitationToNewUser(
            email,
            company.name,
            ownerName,
            userLanguage
          );

          if (!emailSent) {
            emailError = 'E-mail kon niet worden verzonden';
          }
        } catch (emailErr: any) {
          console.error('Email sending error:', emailErr);
          emailError = `E-mail fout: ${emailErr.message}`;
        }

        return {
          success: true,
          message: emailSent 
            ? 'Registratie-uitnodiging succesvol verzonden' 
            : 'Uitnodiging aangemaakt, maar e-mail kon niet worden verzonden',
          userExists: false,
          emailSent,
          emailError,
          invitationId: invitation.id
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
