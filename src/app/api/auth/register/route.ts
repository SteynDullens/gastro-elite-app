import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { 
  sendBusinessRegistrationNotification, 
  sendPersonalRegistrationConfirmation,
  sendBusinessRegistrationConfirmation,
  BusinessRegistrationData,
  PersonalRegistrationData
} from '@/lib/email';
import crypto from 'crypto';

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
      kvkDocumentPath
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
    }

    // Check if user already exists
    console.log('🔍 Checking if user exists:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ User already exists:', {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName
      });
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    console.log('✅ User does not exist, proceeding with registration');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    let user, company = null;

    if (role === 'business') {
      // Create business user with company
      const result = await prisma.$transaction(async (tx) => {
        // Create user first
        const newUser = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone: phone || '',
            isAdmin: false,
            isBlocked: false,
            emailVerificationToken: verificationToken,
          }
        });

        // Create company with owner ID
        const addressString = businessAddress ? 
          `${businessAddress.street || ''}, ${businessAddress.postalCode || ''} ${businessAddress.city || ''}, ${businessAddress.country || ''}`.replace(/^,\s*|,\s*$/g, '') : '';
        
        const newCompany = await tx.company.create({
          data: {
            name: companyName!,
            address: addressString,
            kvkNumber: kvkNumber!,
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

      user = result.user;
      company = result.company;
    } else {
      // Create regular user
      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          phone: phone || '',
          isAdmin: false,
          isBlocked: false,
          emailVerificationToken: verificationToken,
        }
      });
    }

    // Send appropriate email notifications (only if email is configured)
    try {
      // Check if email is configured
      console.log('Email configuration check:');
      console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
      console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
      console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
      console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
      console.log('Parsed SMTP_PORT:', parseInt(process.env.SMTP_PORT || '465'));
      
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log('Email is configured, sending verification email...');
        if (role === 'business' && company) {
          // Send business registration data to admin
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
              country: 'Netherlands',
              postalCode: '',
              street: businessAddress || '',
              city: '',
            },
            kvkDocumentPath
          };
          
          // Send emails synchronously
          try {
            console.log('📧 Sending business registration emails...');
            await Promise.all([
              sendBusinessRegistrationNotification(businessData, kvkDocumentPath),
              sendBusinessRegistrationConfirmation(businessData, verificationToken)
            ]);
            console.log('✅ Business registration emails sent successfully');
          } catch (error) {
            console.error('❌ Error sending business registration emails:', error);
          }
        } else {
          // Send personal registration confirmation
          const personalData: PersonalRegistrationData = {
            firstName,
            lastName,
            email,
            phone: phone || ''
          };
          
          try {
            console.log('📧 Sending personal registration email...');
            const emailResult = await sendPersonalRegistrationConfirmation(personalData, verificationToken);
            console.log('✅ Personal registration email sent successfully:', emailResult);
          } catch (error) {
            console.error('❌ Error sending personal registration email:', error);
            console.error('Error details:', (error as any).message, (error as any).code);
            console.error('Full error:', error);
          }
        }
      } else {
        console.log('Email not configured - skipping email notifications');
      }
    } catch (emailError) {
      console.error('Error sending email notifications:', emailError);
      // Continue with registration even if email sending fails
    }

    // Check if email is configured to determine verification status
    const emailConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
    
    // For testing: auto-verify if email is not configured
    if (!emailConfigured) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: emailConfigured ? false : true // Auto-verify if no email config
      },
      message: role === 'business' 
        ? 'Bedrijfsaccount registratie succesvol. Controleer je e-mail voor verificatie en noteer dat je account binnen 24 uur wordt beoordeeld.'
        : 'Account registratie succesvol. Controleer je e-mail voor verificatie.'
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}