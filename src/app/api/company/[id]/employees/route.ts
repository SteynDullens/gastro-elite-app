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
      // Verify company exists
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true }
      });

      if (!company) {
        return null;
      }

      // Query users directly where companyId matches (not using relation to avoid caching issues)
      // This ensures we get fresh data after deletions
      const employeeUsers = await prisma.user.findMany({
        where: {
          companyId: companyId
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          companyId: true,
          createdAt: true
        }
      });

      console.log('🔍 Found employees:', {
        companyId,
        count: employeeUsers.length,
        employees: employeeUsers.map(emp => ({ id: emp.id, email: emp.email, companyId: emp.companyId }))
      });

      // Get employees list
      // No need to filter again - we already queried with companyId filter
      const employeeList = employeeUsers
        .map(employee => ({
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
      // Show ALL invitations (pending, accepted, rejected) so users can see the full history
      let pendingInvitations: any[] = [];
      try {
        const invitations = await prisma.employeeInvitation.findMany({
          where: {
            companyId: companyId
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

        // Show ALL invitations, including those for existing users
        // If a user is already an employee AND has an accepted invitation, we'll filter it out to avoid duplicates
        // But if they have a pending invitation, show it so users can see "Uitnodiging verzonden" status
        const employeeIds = new Set(employeeList.map(emp => emp.id));
        
        pendingInvitations = invitations
          .filter(inv => {
            // Show invitations without an invitedUser (new user invitations)
            if (!inv.invitedUser) return true;
            
            // For existing users: only filter out if invitation is 'accepted' AND user is already an employee
            // This way, pending invitations for employees still show up
            if (inv.status === 'accepted' && employeeIds.has(inv.invitedUser.id)) {
              return false; // Don't show accepted invitations for users who are already employees (duplicate)
            }
            
            // Show all other invitations (pending, rejected, or accepted for non-employees)
            return true;
          })
          .map(inv => ({
            id: inv.id,
            firstName: inv.invitedUser?.firstName || null,
            lastName: inv.invitedUser?.lastName || null,
            email: inv.email,
            phone: null,
            status: inv.status as 'pending' | 'accepted' | 'rejected',
            createdAt: inv.createdAt,
            invitationId: inv.id
          }));
      } catch (invError: any) {
        // Model doesn't exist yet - migration not run
        console.warn('EmployeeInvitation model not available:', invError.message);
      }

      const allEmployees = [...employeeList, ...pendingInvitations];
      
      console.log('📋 Returning employees list:', {
        companyId,
        employeeCount: employeeList.length,
        invitationCount: pendingInvitations.length,
        totalCount: allEmployees.length,
        employeeEmails: employeeList.map(e => e.email),
        invitationEmails: pendingInvitations.map(i => i.email)
      });
      
      return allEmployees;
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

    // JWT token contains 'id', not 'userId'
    const userId = decodedToken.id || decodedToken.userId;
    console.log('✅ Authenticated user:', userId);
    console.log('🔍 Looking for company with ID:', companyId);
    console.log('🔍 Decoded token:', { id: decodedToken.id, userId: decodedToken.userId, email: decodedToken.email });

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
            }
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

        // Verify that the authenticated user owns this company
        // Only owners can add employees, not regular employees
        // Ensure both IDs are strings for comparison
        const companyOwnerId = String(company.ownerId);
        const requestingUserId = String(userId);
        const userOwnsCompany = companyOwnerId === requestingUserId;
        
        // Also verify by checking if the user has an ownedCompany relationship
        const user = await prisma.user.findUnique({
          where: { id: requestingUserId },
          select: { 
            id: true, 
            email: true,
            ownedCompany: {
              select: { id: true, name: true }
            }
          }
        });
        
        const userOwnsCompanyByRelation = user?.ownedCompany?.id === companyId;
        
        console.log('🔍 Permission check:', {
          companyId,
          companyOwnerId: companyOwnerId,
          requestingUserId: requestingUserId,
          userOwnsCompany,
          userOwnsCompanyByRelation,
          companyName: company.name,
          ownerEmail: company.owner.email,
          userEmail: user?.email,
          userOwnedCompanyId: user?.ownedCompany?.id
        });
        
        if (!userOwnsCompany && !userOwnsCompanyByRelation) {
          console.error('❌ User does not have permission to add employees to this company');
          console.error('   Company owner ID:', companyOwnerId);
          console.error('   Requesting user ID:', requestingUserId);
          console.error('   User owned company ID:', user?.ownedCompany?.id);
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
        // Use direct companyId check instead of relation to avoid caching issues
        const isAlreadyEmployee = existingUser.companyId === companyId;
        
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
          // P2021 = table doesn't exist - migration needed
          if (invitationError.code === 'P2021') {
            console.error('❌ EmployeeInvitation table does not exist (P2021). Migration required: npx prisma migrate deploy');
            throw new Error('EmployeeInvitation table does not exist. Please run: npx prisma migrate deploy');
          } else {
            console.warn('⚠️ Could not create invitation record:', invitationError.code || invitationError.message);
            throw invitationError; // Re-throw other errors
          }
        }
        
        // If no invitation was created, we can't send email with action buttons
        if (!invitation || !invitation.id) {
          throw new Error('Failed to create invitation record');
        }

        // Link user to company (personal account joining as employee)
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { companyId: company.id }
        });

        // Keep invitation as 'pending' so it shows in the list with status "Uitnodiging verzonden"
        // Don't update to 'accepted' immediately - let it show as pending so users can see the invitation was sent

        // Send invitation email to existing user
        // IMPORTANT: Only send email if invitation was created successfully (with valid ID)
        if (!invitation || !invitation.id) {
          console.error('❌ Cannot send email: invitation was not created or has no ID');
          emailError = 'Uitnodiging kon niet worden aangemaakt - e-mail niet verzonden';
        } else {
          try {
            const employeeName = `${existingUser.firstName} ${existingUser.lastName}`;
            const ownerName = `${company.owner.firstName} ${company.owner.lastName}`;
            const userLanguage = language || 'nl';
            
            console.log('📧 Preparing to send invitation email to existing user:', {
              email,
              employeeName,
              companyName: company.name,
              ownerName,
              invitationId: invitation.id,
              companyId: company.id,
              language: userLanguage,
              invitationExists: !!invitation,
              invitationHasId: !!invitation.id
            });
            
            // Send email with detailed logging
            emailSent = await sendEmployeeInvitationToExistingUser(
              email,
              employeeName,
              company.name,
              ownerName,
              invitation.id, // Pass invitation ID for action buttons
              company.id, // Pass company ID for action URLs
              userLanguage
            );
            
            console.log('📧 Email sending result:', {
              emailSent,
              email,
              invitationId: invitation.id
            });
            
            if (!emailSent) {
              emailError = 'E-mail kon niet worden verzonden, maar gebruiker is toegevoegd';
              console.error('❌ Email sending returned false - check email configuration and logs');
            } else {
              console.log('✅ Email sent successfully to:', email);
            }
          } catch (emailErr: any) {
            console.error('❌ Email sending error:', emailErr);
            console.error('Error details:', {
              name: emailErr.name,
              message: emailErr.message,
              code: emailErr.code,
              command: emailErr.command,
              responseCode: emailErr.responseCode,
              stack: emailErr.stack
            });
            emailError = `E-mail fout: ${emailErr.message}`;
          }
        }

        // Always return success if user was added, even if email failed
        // But warn if invitation record wasn't created (migration needed)
        return {
          success: true,
          message: emailSent 
            ? 'Uitnodiging verzonden naar bestaande gebruiker' 
            : 'Gebruiker toegevoegd. E-mail kon niet worden verzonden - controleer de server logs.',
          userExists: true,
          emailSent,
          emailError: emailError || (emailSent ? null : 'E-mail kon niet worden verzonden'),
          invitationCreated: !!invitation,
          migrationWarning: !invitation ? 'EmployeeInvitation table does not exist - run migration: npx prisma migrate deploy' : null
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
      console.error('Database status:', JSON.stringify(dbStatus, null, 2));
      
      // Check if the error is a business logic error (like "Company not found")
      if (dbStatus.error) {
        const errorMessage = dbStatus.error;
        console.log('🔍 Error message from dbStatus:', errorMessage);
        
        // Handle specific business logic errors (case-insensitive)
        const lowerError = errorMessage.toLowerCase();
        
        if (lowerError.includes('company not found') || lowerError.includes('bedrijf niet gevonden')) {
          console.log('✅ Detected: Company not found error');
          return NextResponse.json(
            { 
              success: false,
              error: 'Company not found'
            },
            { status: 404 }
          );
        }
        
        if (lowerError.includes('uitnodiging') || lowerError.includes('invitation')) {
          console.log('✅ Detected: Invitation error');
          return NextResponse.json(
            { 
              success: false,
              error: errorMessage
            },
            { status: 400 }
          );
        }
        
        if (lowerError.includes('gebruiker') || lowerError.includes('team') || lowerError.includes('bedrijfsaccount') || lowerError.includes('user')) {
          console.log('✅ Detected: User/team error');
          return NextResponse.json(
            { 
              success: false,
              error: errorMessage
            },
            { status: 400 }
          );
        }
        
        if (lowerError.includes('permission') || lowerError.includes('toegang')) {
          console.log('✅ Detected: Permission error');
          return NextResponse.json(
            { 
              success: false,
              error: errorMessage
            },
            { status: 403 }
          );
        }
      }
      
      // Check if it's actually a connection error vs a business logic error
      const isActualConnectionError = dbStatus.error && (
        dbStatus.error.toLowerCase().includes('connect') ||
        dbStatus.error.toLowerCase().includes('econnrefused') ||
        dbStatus.error.toLowerCase().includes('timeout') ||
        dbStatus.error.toLowerCase().includes('p1001') ||
        dbStatus.error.toLowerCase().includes('p1002') ||
        dbStatus.error.toLowerCase().includes('p2024')
      );
      
      console.log('🔍 Is actual connection error?', isActualConnectionError);
      console.log('🔍 DB connected status:', dbStatus.connected);
      
      // Generic database error
      return NextResponse.json(
        { 
          success: false,
          error: isActualConnectionError || !dbStatus.connected
            ? 'Database connection error. Please check your connection and try again.'
            : (dbStatus.error || 'Database operation failed. Please try again.')
        },
        { status: isActualConnectionError || !dbStatus.connected ? 503 : 500 }
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
