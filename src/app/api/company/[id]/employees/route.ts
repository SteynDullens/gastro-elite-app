import { NextRequest, NextResponse } from 'next/server';
import { safeDbOperation } from '@/lib/prisma';
import { getDbStatus } from '@/lib/db-connection';
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
    console.log('🔍 Looking for company with ID:', companyId);

    // Get company and owner info
    let result;
    try {
      result = await safeDbOperation(async (prisma) => {
        if (!prisma) {
          throw new Error('Database connection not available');
        }

        console.log('🔍 Querying database for company:', companyId);
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
          console.error('❌ Company not found with ID:', companyId);
          // Let's also check if there are any companies at all
          const allCompanies = await prisma.company.findMany({
            select: { id: true, name: true, ownerId: true }
          });
          console.log('📋 Available companies:', allCompanies);
          throw new Error('Company not found');
        }

        // Verify that the authenticated user owns this company or is an employee
        const userOwnsCompany = company.ownerId === userId;
        const userIsEmployee = company.employees.some(emp => emp.id === userId);
        
        if (!userOwnsCompany && !userIsEmployee) {
          console.error('❌ User does not have permission to add employees to this company');
          throw new Error('You do not have permission to add employees to this company');
        }

        console.log('✅ Company found:', company.name, 'Owner:', company.ownerId, 'Requesting user:', userId);

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
          },
          company: {
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
        // IMPORTANT: Only personal users (without business accounts) can be invited as employees
        // Check if user owns a business account - business users cannot be employees
        if (existingUser.ownedCompany) {
          console.error('❌ Cannot invite business user as employee:', {
            email: existingUser.email,
            companyName: existingUser.ownedCompany.name
          });
          throw new Error('Alleen persoonlijke gebruikers kunnen worden uitgenodigd als medewerker. Deze gebruiker heeft al een bedrijfsaccount.');
        }

        // Check if user is already an employee of this company
        const isAlreadyEmployee = company.employees.some(emp => emp.id === existingUser.id);
        
        if (isAlreadyEmployee) {
          throw new Error('Deze gebruiker is al lid van uw team');
        }

        // Check if user is already an employee of another company
        if (existingUser.company && existingUser.company.id !== companyId) {
          throw new Error(`Deze gebruiker is al medewerker van ${existingUser.company.name} en kan niet bij meerdere bedrijven werken.`);
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

        // Always return success if user was added, even if email failed
        return {
          success: true,
          message: emailSent 
            ? 'Uitnodiging verzonden naar bestaande gebruiker' 
            : 'Gebruiker toegevoegd. E-mail kon niet worden verzonden - controleer de server logs.',
          userExists: true,
          emailSent,
          emailError: emailError || (emailSent ? null : 'E-mail kon niet worden verzonden')
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

        // Always return success if invitation was created, even if email failed
        return {
          success: true,
          message: emailSent 
            ? 'Registratie-uitnodiging succesvol verzonden' 
            : 'Uitnodiging aangemaakt. E-mail kon niet worden verzonden - controleer de server logs.',
          userExists: false,
          emailSent,
          emailError: emailError || (emailSent ? null : 'E-mail kon niet worden verzonden'),
          invitationId: invitation?.id || null
        };
      }
    });

    // Check if result is null (which means safeDbOperation caught an error)
    if (!result) {
      console.error('❌ safeDbOperation returned null - database operation failed');
      // Check if it's a connection issue or a specific error
      const dbStatus = getDbStatus();
      console.error('Database status:', dbStatus);
      
      // Check if the error is a business logic error (like "Company not found")
      if (dbStatus.error) {
        const errorMessage = dbStatus.error;
        
        // Handle specific business logic errors
        if (errorMessage.includes('Company not found')) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Company not found'
            },
            { status: 404 }
          );
        }
        
        if (errorMessage.includes('uitnodiging')) {
          return NextResponse.json(
            { 
              success: false,
              error: errorMessage
            },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes('gebruiker') || errorMessage.includes('team')) {
          return NextResponse.json(
            { 
              success: false,
              error: errorMessage
            },
            { status: 400 }
          );
        }
      }
      
      // Generic database error
      return NextResponse.json(
        { 
          success: false,
          error: dbStatus.connected 
            ? (dbStatus.error || 'Database operation failed. Please try again.')
            : 'Database connection error. Please check your connection and try again.'
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Employee invitation completed:', result);
    return NextResponse.json(result);
    } catch (dbError: any) {
      // Handle errors from safeDbOperation
      console.error('❌ Database operation error:', dbError);
      return NextResponse.json(
        { 
          success: false,
          error: dbError.message || 'Database operation failed'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Error adding employee:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to add employee' 
      },
      { status: 500 }
    );
  }
}
