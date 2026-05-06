import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, logError } from '@/lib/auth';
import { getPrisma, safeDbOperation } from '@/lib/prisma';
import { formatSmtpErrorForAdmin } from '@/lib/smtp-admin-hint';
import { normalizeEmailForSMTP } from '@/lib/email-address';
import {
  sendPasswordResetNotification,
  sendPersonalRegistrationConfirmation,
  sendBusinessRegistrationConfirmation,
  sendBusinessConversionSetupEmail,
  type EmailSendResult,
} from '@/lib/email';

function createBusinessConversionToken(userId: string): string {
  const secret = process.env.JWT_SECRET || process.env.DWT_SECRET || 'gastro-elite-secret';
  const payload = `${userId}.${Date.now()}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32);
  return `${payload}.${signature}`;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const users = await safeDbOperation(async (prisma) => {
      return await prisma.user.findMany({
        where: {
          deletedAt: null // Exclude soft deleted users
        },
        include: {
          ownedCompany: {
            select: {
              name: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    });

    if (!users) {
      return NextResponse.json({
        success: true,
        users: []
      });
    }

    // Transform to match expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      account_type: user.isAdmin
        ? 'admin'
        : (user.ownedCompany && user.ownedCompany.status !== 'draft_kvk' ? 'business' : 'user'),
      isActive: !user.isBlocked,
      emailVerified: user.emailVerified,
      companyName: user.ownedCompany?.name || null,
      companyStatus: user.ownedCompany?.status || null, // pending, approved, rejected
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      users: transformedUsers
    });

  } catch (error: any) {
    await logError({
      level: 'error',
      message: `Failed to fetch users: ${error.message}`,
      url: request.url,
      method: 'GET'
    });

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || !decoded.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId, action, data } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    /** Verificatie-mail eerst versturen; token pas opslaan bij succes (oude link blijft dan geldig bij SMTP-fout). */
    if (action === 'resend_verification') {
      const prisma = getPrisma();
      if (!prisma) {
        return NextResponse.json(
          { success: false, error: 'Database niet bereikbaar' },
          { status: 503 }
        );
      }

      const full = await prisma.user.findUnique({
        where: { id: userId },
        include: { ownedCompany: true },
      });

      if (!full) {
        return NextResponse.json(
          { success: false, error: 'Gebruiker niet gevonden' },
          { status: 404 }
        );
      }
      if (full.deletedAt) {
        return NextResponse.json(
          { success: false, error: 'Gebruiker is verwijderd' },
          { status: 400 }
        );
      }
      if (full.emailVerified) {
        return NextResponse.json(
          { success: false, error: 'E-mail is al geverifieerd' },
          { status: 400 }
        );
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');

      let mailResult: EmailSendResult;
      if (full.ownedCompany) {
        const c = full.ownedCompany;
        mailResult = await sendBusinessRegistrationConfirmation(
          {
            firstName: full.firstName,
            lastName: full.lastName,
            email: full.email,
            phone: full.phone || '',
            companyName: c.name,
            kvkNumber: c.kvkNumber,
            vatNumber: c.vatNumber || undefined,
            companyPhone: c.companyPhone || undefined,
            address: {
              country: 'Nederland',
              postalCode: '',
              street: c.address,
              city: '',
            },
          },
          verificationToken
        );
      } else {
        mailResult = await sendPersonalRegistrationConfirmation(
          {
            firstName: full.firstName,
            lastName: full.lastName,
            email: full.email,
            phone: full.phone || '',
          },
          verificationToken
        );
      }

      if (!mailResult.success) {
        await logError({
          level: 'warning',
          message: `Admin resend_verification SMTP mislukt user ${userId}: ${mailResult.error}`,
          userId: decoded.id,
          url: request.url,
          method: 'PUT',
        });
        return NextResponse.json(
          {
            success: false,
            emailSent: false,
            emailError: formatSmtpErrorForAdmin(mailResult.error),
            error: 'Verificatie-e-mail niet verzonden',
          },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: userId },
        data: { emailVerificationToken: verificationToken },
      });

      const normalizedEmail = normalizeEmailForSMTP(full.email);
      if (normalizedEmail !== full.email) {
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { email: normalizedEmail },
          });
        } catch {
          /* bij uniek conflict tweede adres laten zoals het was */
        }
      }

      await logError({
        level: 'info',
        message: `Admin resend_verification OK user ${userId}`,
        userId: decoded.id,
        url: request.url,
        method: 'PUT',
      });

      return NextResponse.json({
        success: true,
        emailSent: true,
        message: 'Verificatie-e-mail verzonden',
      });
    }

    let emailSent = false;
    let emailError: string | null = null;
    let passwordToUse: string | null = null;
    let conversionMailPayload: null | {
      toEmail: string;
      firstName: string;
      lastName: string;
      companyName: string;
      kvkNumber: string;
      vatNumber?: string;
      companyPhone?: string;
      address?: string;
      conversionToken: string;
    } = null;

    const result = await safeDbOperation(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isBlocked: true,
          isAdmin: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      switch (action) {
        case 'toggle_active':
          await prisma.user.update({
            where: { id: userId },
            data: { isBlocked: !user.isBlocked }
          });
          break;

        case 'reset_password':
          const { newPassword, generatePassword } = data;
          
          // Generate password if requested, otherwise use provided password
          let generatedPasswordToUse: string;
          if (generatePassword) {
            // Generate a secure random password: 12 characters with mix of uppercase, lowercase, numbers
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const numbers = '0123456789';
            const allChars = uppercase + lowercase + numbers;
            
            let generatedPassword = '';
            // Ensure at least one of each type
            generatedPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
            generatedPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
            generatedPassword += numbers[Math.floor(Math.random() * numbers.length)];
            
            // Fill the rest randomly
            for (let i = 3; i < 12; i++) {
              generatedPassword += allChars[Math.floor(Math.random() * allChars.length)];
            }
            
            // Shuffle the password
            generatedPasswordToUse = generatedPassword.split('').sort(() => Math.random() - 0.5).join('');
          } else {
            if (!newPassword || newPassword.length < 6) {
              throw new Error('New password must be at least 6 characters long');
            }
            generatedPasswordToUse = newPassword;
          }
          
          // Store password outside transaction for email sending
          passwordToUse = generatedPasswordToUse;
          
          const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(generatedPasswordToUse, 12);
          await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
          });
          
          break;

        case 'change_role':
          const { newRole } = data;
          if (!['user', 'business', 'admin'].includes(newRole)) {
            throw new Error('Invalid role');
          }

          // "business" is not a standalone role flag in this schema.
          // A user is considered business only when linked as company owner.
          if (newRole === 'business') {
            throw new Error('Om een gebruiker business te maken moet er een bedrijfsprofiel (company owner) gekoppeld worden. Rolwissel alleen ondersteunt user/admin.');
          }

          // Only toggle admin privileges here.
          await prisma.user.update({
            where: { id: userId },
            data: { isAdmin: newRole === 'admin' }
          });
          break;

        case 'start_business_conversion': {
          const {
            companyName,
            kvkNumber,
            vatNumber,
            companyPhone,
            businessAddress,
          } = data || {};

          if (!companyName) {
            throw new Error('Bedrijfsnaam is verplicht.');
          }

          const target = await prisma.user.findUnique({
            where: { id: userId },
            include: { ownedCompany: true },
          });

          if (!target) {
            throw new Error('Gebruiker niet gevonden.');
          }
          if (target.ownedCompany) {
            throw new Error('Deze gebruiker heeft al een bedrijfsprofiel.');
          }

          const conversionToken = createBusinessConversionToken(target.id);
          const addressString = businessAddress
            ? `${businessAddress.street || ''} ${businessAddress.houseNumber || ''}, ${businessAddress.postalCode || ''} ${businessAddress.city || ''}, ${businessAddress.country || 'Nederland'}`
                .trim()
                .replace(/\s+/g, ' ')
                .replace(/,\s*,/g, ',')
            : '';

          const newCompany = await prisma.company.create({
            data: {
              name: companyName,
              kvkNumber: kvkNumber || '',
              vatNumber: vatNumber || null,
              companyPhone: companyPhone || null,
              address: addressString,
              status: 'draft_kvk',
              ownerId: target.id,
            },
          });

          await prisma.user.update({
            where: { id: target.id },
            data: {
              companyId: newCompany.id,
            },
          });

          conversionMailPayload = {
            toEmail: target.email,
            firstName: target.firstName,
            lastName: target.lastName,
            companyName,
            kvkNumber: kvkNumber || 'Nog in te vullen',
            vatNumber: vatNumber || undefined,
            companyPhone: companyPhone || undefined,
            address: addressString || undefined,
            conversionToken,
          };
          break;
        }

        default:
          throw new Error('Invalid action');
      }

      return { success: true as const };
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      );
    }

    // Send email notification for password reset (after transaction completes)
    let emailResultDetails: any = null;
    if (action === 'reset_password' && result) {
      const { sendEmail, userEmail, firstName, lastName } = data;
      
      if (sendEmail && userEmail && firstName && lastName && passwordToUse) {
        try {
          console.log(`📧 Attempting to send password reset email to: ${userEmail}`);
          console.log(`📧 Email environment check:`);
          console.log(`  SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET'}`);
          console.log(`  SMTP_USER: ${process.env.SMTP_USER || 'NOT SET'}`);
          console.log(`  SMTP_PASS: ${process.env.SMTP_PASS ? 'SET (' + process.env.SMTP_PASS.length + ' chars)' : 'NOT SET'}`);
          
          const emailResult = await sendPasswordResetNotification(userEmail, firstName, lastName, passwordToUse);
          emailSent = emailResult.success;
          emailResultDetails = emailResult; // Store for response
          
          if (emailResult.success) {
            console.log(`✅ Password reset email sent successfully to ${userEmail}`);
            console.log(`  Message ID: ${emailResult.messageId}`);
            console.log(`  Accepted: ${JSON.stringify(emailResult.accepted)}`);
            console.log(`  Response: ${emailResult.response}`);
          } else {
            emailError = emailResult.error || 'Email function returned false';
            console.error(`❌ Password reset email failed for ${userEmail}:`, emailError);
            if (emailResult.rejected && emailResult.rejected.length > 0) {
              emailError += ` (Rejected: ${emailResult.rejected.join(', ')})`;
            }
          }
        } catch (emailErrorCaught: any) {
          emailError = emailErrorCaught.message || 'Unknown email error';
          console.error('❌ Error sending password reset email:', emailErrorCaught);
          console.error('Error name:', emailErrorCaught.name);
          console.error('Error code:', emailErrorCaught.code);
          console.error('Error command:', emailErrorCaught.command);
          console.error('Error response:', emailErrorCaught.response);
          console.error('Error responseCode:', emailErrorCaught.responseCode);
          console.error('Error stack:', emailErrorCaught.stack);
          
          // Try to stringify the error for more details
          try {
            console.error('Full error object:', JSON.stringify(emailErrorCaught, Object.getOwnPropertyNames(emailErrorCaught), 2));
          } catch (e) {
            console.error('Could not stringify error:', e);
          }
        }
      } else {
        console.log(`⚠️ Email not sent - missing data:`, {
          sendEmail,
          userEmail,
          firstName,
          lastName,
          passwordToUse: !!passwordToUse
        });
      }
    }

    if (action === 'start_business_conversion' && result && conversionMailPayload) {
      const conversionMail = await sendBusinessConversionSetupEmail(conversionMailPayload);
      if (!conversionMail.success) {
        return NextResponse.json(
          {
            success: false,
            error: `Conversie is aangemaakt, maar de e-mail kon niet worden verzonden: ${conversionMail.error || 'onbekende fout'}`,
          },
          { status: 400 }
        );
      }
    }

    // Log admin action
    await logError({
      level: 'info',
      message: `Admin action: ${action} performed on user ID: ${userId}`,
      userId: decoded.id,
      url: request.url,
      method: 'PUT'
    });

    const responseData: any = {
      success: true,
      message: 'User updated successfully'
    };
    
    if (action === 'reset_password') {
      responseData.emailSent = emailSent;
      responseData.emailError = emailError;
      
      // Include detailed email result information
      if (emailResultDetails) {
        if (emailResultDetails.success) {
          responseData.emailMessageId = emailResultDetails.messageId;
          responseData.emailAccepted = emailResultDetails.accepted;
          responseData.emailResponse = emailResultDetails.response;
        } else {
          responseData.emailRejected = emailResultDetails.rejected;
          responseData.emailDetails = {
            error: emailError,
            suggestion: 'Check Vercel logs for detailed SMTP server response. Also check spam folder if email was accepted by server.'
          };
        }
      }
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    await logError({
      level: 'error',
      message: `Admin user update failed: ${error.message}`,
      url: request.url,
      method: 'PUT'
    });

    return NextResponse.json(
      { error: error?.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

