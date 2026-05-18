import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { safeDbOperation } from '@/lib/prisma';
import { notifyOwnerEmployeeJoinedTeam } from '@/lib/notify-owner-employee-joined';
import { 
  sendBusinessRegistrationNotification, 
  sendPersonalRegistrationConfirmation,
  sendBusinessRegistrationConfirmation,
  BusinessRegistrationData,
  PersonalRegistrationData
} from '@/lib/email';
import crypto from 'crypto';
import { emailLookupWhere, normalizeEmailForSMTP } from '@/lib/email-address';

export async function POST(request: NextRequest) {
  try {
    const registrationData = await request.json();
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      role, 
      companyName,
      kvkNumber,
      vatNumber,
      companyPhone,
      businessAddress,
      kvkDocumentPath,
      kvkDocumentData
    } = registrationData;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate business account requirements
    if (role === 'business') {
      if (!companyName || !kvkNumber) {
        return NextResponse.json(
          { error: 'Company name and KvK number are required for business accounts' },
          { status: 400 }
        );
      }
      if (!kvkDocumentPath) {
        return NextResponse.json(
          { error: 'KvK document is required for business accounts' },
          { status: 400 }
        );
      }
    }

    // Employee invitation (register via link from team invite) — only valid for personal accounts
    const { invitationId, companyId } = registrationData as {
      invitationId?: string;
      companyId?: string;
    };
    if (invitationId || companyId) {
      if (!invitationId || !companyId) {
        return NextResponse.json(
          { error: 'Ongeldige uitnodigingslink (ontbrekende gegevens).' },
          { status: 400 }
        );
      }
      if (role === 'business') {
        return NextResponse.json(
          {
            error:
              'Je bent uitgenodigd als medewerker. Registreer een persoonlijk account (niet als bedrijf).',
          },
          { status: 400 }
        );
      }
    }
    
    const emailNorm = normalizeEmailForSMTP(email);

    // Check if user already exists
    console.log('🔍 Checking if user exists:', emailNorm);
    const existingUser = await safeDbOperation(async (prisma) => {
      return await prisma.user.findFirst({
        where: emailLookupWhere(email),
      });
    });

    if (existingUser) {
      console.log('❌ User already exists');
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    console.log('✅ User does not exist, proceeding with registration');
    console.log('📧 Registration invitation check:', { invitationId, companyId, email });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    let user: any, company: any = null;

    if (role === 'business') {
      // Create business user with company
      const result = await safeDbOperation(async (prisma) => {
        return await prisma.$transaction(async (tx) => {
        // Create user first
        const newUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email: emailNorm,
            password: hashedPassword,
            phone: phone || '',
            isAdmin: false,
            isBlocked: false,
            emailVerificationToken: verificationToken,
          }
        });

        // Create company with owner ID
        const addressString = businessAddress ? 
          `${businessAddress.street || ''} ${businessAddress.houseNumber || ''}, ${businessAddress.postalCode || ''} ${businessAddress.city || ''}, ${businessAddress.country || 'Nederland'}`.trim().replace(/\s+/g, ' ').replace(/,\s*,/g, ',') : '';
        
        const newCompany = await tx.company.create({
          data: {
            name: companyName!,
            address: addressString,
            kvkNumber: kvkNumber!,
            vatNumber: vatNumber || null,
            companyPhone: companyPhone || null,
            kvkDocumentPath: kvkDocumentPath || null,
            kvkDocumentData: kvkDocumentData || null,
            status: 'pending',
            ownerId: newUser.id,
          }
        });

        // Update user with company ID
        await tx.user.update({
          where: { id: newUser.id },
          data: { companyId: newCompany.id }
        });

        return { user: newUser, company: newCompany };
        });
      });

      user = result?.user;
      company = result?.company;
    } else {
      // Create personal user
      const result = await safeDbOperation(async (prisma) => {
        return await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              firstName,
              lastName,
              email: emailNorm,
              password: hashedPassword,
              phone: phone || '',
              isAdmin: false,
              isBlocked: false,
              emailVerificationToken: verificationToken,
            }
          });

          // Teamuitnodiging: na registratie direct medewerker (zelfde effect als "Accepteren" in de mail)
          if (invitationId && companyId) {
            const invitation = await tx.employeeInvitation.findFirst({
              where: {
                id: invitationId,
                companyId,
                email: emailNorm,
                status: 'pending',
              },
            });

            if (invitation) {
              await tx.employeeInvitation.update({
                where: { id: invitation.id },
                data: {
                  status: 'accepted',
                  invitedUserId: newUser.id,
                },
              });

              await tx.user.update({
                where: { id: newUser.id },
                data: { companyId },
              });

              try {
                await tx.companyMembership.upsert({
                  where: {
                    userId_companyId: {
                      userId: newUser.id,
                      companyId,
                    },
                  },
                  create: {
                    userId: newUser.id,
                    companyId,
                  },
                  update: {},
                });
              } catch (memErr: unknown) {
                console.warn(
                  '⚠️ CompanyMembership upsert niet uitgevoerd:',
                  memErr instanceof Error ? memErr.message : memErr
                );
              }

              console.log('✅ Medewerker gekoppeld bij registratie:', {
                invitationId: invitation.id,
                companyId,
                userId: newUser.id,
              });
            } else {
              console.warn(
                '⚠️ Geen passende openstaande uitnodiging voor dit e-mailadres — alleen account aangemaakt.'
              );
            }
          }

          return newUser;
        });
      });
      user = result;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    if (
      role !== 'business' &&
      invitationId &&
      companyId &&
      user.companyId === companyId
    ) {
      try {
        await notifyOwnerEmployeeJoinedTeam({
          companyId,
          employee: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          },
        });
      } catch (notifyErr) {
        console.error('Register team join: owner notify failed:', notifyErr);
      }

      try {
        const { applyEmployeeBillingWaiver } = await import('@/lib/billing/waiver');
        await applyEmployeeBillingWaiver(user.id, companyId);
        const { syncCompanySubscriptionBilling } = await import('@/lib/billing/company-sync');
        await syncCompanySubscriptionBilling(companyId);
      } catch (billingErr) {
        console.error('Register: billing waiver failed:', billingErr);
      }
    }

    // Send appropriate email notifications (only if email is configured)
    try {
      console.log('Email configuration check:');
      console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
      console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
      
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log('Email is configured, sending verification email...');
        if (role === 'business' && company) {
          const businessData: BusinessRegistrationData = {
            firstName,
            lastName,
            email,
            phone: phone || '',
            companyName: companyName!,
            kvkNumber: kvkNumber!,
            vatNumber: vatNumber || '',
            companyPhone: companyPhone || '',
            address: {
              country: businessAddress?.country || 'Nederland',
              postalCode: businessAddress?.postalCode || '',
              street: businessAddress?.street || '',
              city: businessAddress?.city || '',
            },
            kvkDocumentPath
          };
          
          try {
            console.log('📧 Sending business registration emails...');
            await sendBusinessRegistrationNotification(
              businessData,
              kvkDocumentPath,
              kvkDocumentData,
              company.id
            );
            const confirmResult = await sendBusinessRegistrationConfirmation(
              businessData,
              verificationToken
            );
            if (!confirmResult.success) {
              console.error(
                '❌ Business verification e-mail mislukt:',
                confirmResult.error
              );
            }
            console.log('✅ Business registration notification flow done');
          } catch (error) {
            console.error('❌ Error sending business registration emails:', error);
          }
        } else {
          const personalData: PersonalRegistrationData = {
            firstName,
            lastName,
            email,
            phone: phone || ''
          };
          
          try {
            console.log('📧 Sending personal registration email...');
            const pResult = await sendPersonalRegistrationConfirmation(
              personalData,
              verificationToken
            );
            if (pResult.success) {
              console.log('✅ Personal registration email sent successfully');
            } else {
              console.error(
                '❌ Personal registration email failed:',
                pResult.error
              );
            }
          } catch (error) {
            console.error('❌ Error sending personal registration email:', error);
          }
        }
      } else {
        console.log('Email not configured - skipping email notifications');
      }
    } catch (emailError) {
      console.error('Error sending email notifications:', emailError);
    }

    // Check if email is configured to determine verification status
    const emailConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
    
    // For testing: auto-verify if email is not configured
    if (!emailConfigured) {
      await safeDbOperation(async (prisma) => {
        return await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
        });
      });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: emailConfigured ? false : true
      },
      message: role === 'business' 
        ? 'Bedrijfsaccount registratie succesvol. Controleer je e-mail voor verificatie.'
        : 'Account registratie succesvol. Controleer je e-mail voor verificatie.'
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
