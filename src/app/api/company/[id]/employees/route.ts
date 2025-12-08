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
          }
        }
      });

      if (!company) {
        return null;
      }

      // Get employees list
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

      // Try to get invitations (if model exists)
      let pendingInvitations: any[] = [];
      try {
        const invitations = await prisma.employeeInvitation.findMany({
          where: {
            companyId: companyId,
            status: 'pending'
          },
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
        });

        pendingInvitations = invitations
          .filter(inv => !inv.invitedUser)
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
      } catch (invError: any) {
        // Model doesn't exist yet - migration not run
        console.warn('EmployeeInvitation model not available:', invError.message);
      }

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
    const body = await request.json();
    const { email, language } = body;
    
    console.log('📧 Employee invitation request:', { companyId, email, language });
    
    if (!email) {
      console.error('❌ No email provided');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      console.error('❌ No auth token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      console.error('❌ Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.userId;
    console.log('✅ Authenticated user:', userId);

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
        }
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Check if invitation already exists (if model is available)
      try {
        const existingInvitation = await prisma.employeeInvitation.findFirst({
          where: {
            companyId: companyId,
            email: email.toLowerCase().trim(),
            status: 'pending'
          }
        });
        
        if (existingInvitation) {
          throw new Error('Er is al een uitnodiging verzonden naar dit e-mailadres');
        }
      } catch (invCheckError: any) {
        // If model doesn't exist or other database error, skip this check
        if (invCheckError.message && invCheckError.message.includes('uitnodiging')) {
          // This is our intentional error, re-throw it
          throw invCheckError;
        }
        // Otherwise, it's a database/model error - log and continue
        console.warn('Could not check for existing invitations (model may not exist):', invCheckError.message || invCheckError.code);
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

        // Create invitation record (with error handling for migration issues)
        let invitation;
        try {
          invitation = await prisma.employeeInvitation.create({
            data: {
              email: email.toLowerCase().trim(),
              companyId: company.id,
              invitedBy: userId,
              invitedUserId: existingUser.id,
              status: 'pending'
            }
          });
          console.log('✅ Invitation record created:', invitation.id);
        } catch (invitationError: any) {
          console.warn('⚠️ Could not create invitation record:', invitationError.code || invitationError.message);
          // If model doesn't exist or other database error, continue without invitation tracking
          // Don't throw - we can still add the employee and send email
          invitation = null;
        }

        // Link user to company (personal account joining as employee)
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { companyId: company.id }
        });

        // Update invitation to accepted (if invitation was created)
        if (invitation) {
          try {
            await prisma.employeeInvitation.update({
              where: { id: invitation.id },
              data: { status: 'accepted' }
            });
          } catch (updateError: any) {
            console.warn('Could not update invitation status:', updateError);
            // Continue anyway - user is already linked
          }
        }

        // Send invitation email to existing user
        try {
          const employeeName = `${existingUser.firstName} ${existingUser.lastName}`;
          const ownerName = `${company.owner.firstName} ${company.owner.lastName}`;
          const userLanguage = language || 'nl';
          
          console.log('📧 Sending invitation email to existing user:', {
            email,
            employeeName,
            companyName: company.name,
            ownerName,
            language: userLanguage
          });
          
          emailSent = await sendEmployeeInvitationToExistingUser(
            email,
            employeeName,
            company.name,
            ownerName,
            userLanguage
          );

          console.log(emailSent ? '✅ Email sent successfully' : '❌ Email sending returned false');
          
          if (!emailSent) {
            emailError = 'E-mail kon niet worden verzonden, maar gebruiker is toegevoegd';
          }
        } catch (emailErr: any) {
          console.error('❌ Email sending error:', emailErr);
          console.error('Error details:', {
            name: emailErr.name,
            message: emailErr.message,
            stack: emailErr.stack
          });
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
        // User doesn't exist - create invitation record (with error handling)
        let invitation;
        try {
          invitation = await prisma.employeeInvitation.create({
            data: {
              email: email.toLowerCase().trim(),
              companyId: company.id,
              invitedBy: userId,
              status: 'pending'
            }
          });
          console.log('✅ Invitation record created:', invitation.id);
        } catch (invitationError: any) {
          console.warn('⚠️ Could not create invitation record:', invitationError.code || invitationError.message);
          // If model doesn't exist or other database error, continue without invitation tracking
          // Don't throw - we can still send the email
          invitation = null;
        }

        // Send registration invitation
        try {
          const ownerName = `${company.owner.firstName} ${company.owner.lastName}`;
          const userLanguage = language || 'nl';
          
          console.log('📧 Sending registration invitation email:', {
            email,
            companyName: company.name,
            ownerName,
            language: userLanguage
          });
          
          emailSent = await sendEmployeeInvitationToNewUser(
            email,
            company.name,
            ownerName,
            userLanguage
          );

          console.log(emailSent ? '✅ Email sent successfully' : '❌ Email sending returned false');

          if (!emailSent) {
            emailError = 'E-mail kon niet worden verzonden';
          }
        } catch (emailErr: any) {
          console.error('❌ Email sending error:', emailErr);
          console.error('Error details:', {
            name: emailErr.name,
            message: emailErr.message,
            stack: emailErr.stack
          });
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
          invitationId: invitation?.id || null
        };
      }
    });

    console.log('✅ Employee invitation completed:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ Error adding employee:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      { error: error.message || 'Failed to add employee' },
      { status: 500 }
    );
  }
}
