import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { safeDbOperation } from '@/lib/prisma';
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

    // Check if user already exists
    console.log('🔍 Checking if user exists:', email);
    const existingUser = await safeDbOperation(async (prisma) => {
      return await prisma.user.findUnique({
      where: { email }
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
      // Create regular user
      user = await safeDbOperation(async (prisma) => {
        return await prisma.user.create({
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
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
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
              country: 'Netherlands',
              postalCode: '',
              street: businessAddress || '',
              city: '',
            },
            kvkDocumentPath
          };
          
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
          const personalData: PersonalRegistrationData = {
            firstName,
            lastName,
            email,
            phone: phone || ''
          };
          
          try {
            console.log('📧 Sending personal registration email...');
            await sendPersonalRegistrationConfirmation(personalData, verificationToken);
            console.log('✅ Personal registration email sent successfully');
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
