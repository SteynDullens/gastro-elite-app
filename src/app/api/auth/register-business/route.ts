import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendBusinessRegistrationNotification, sendBusinessRegistrationConfirmation } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      companyName,
      vatNumber,
      kvkNumber,
      businessAddress,
      contactName,
      contactPhone,
      contactEmail,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !companyName || !kvkNumber || !businessAddress || !contactName || !contactPhone || !contactEmail) {
      return NextResponse.json(
        { message: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user and company in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company first
      const company = await tx.company.create({
        data: {
          name: companyName,
          address: businessAddress,
          kvkNumber: kvkNumber,
          ownerId: '', // Will be updated after user creation
        }
      });

      // Create user
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          phone: phone || '',
          isAdmin: false,
          isBlocked: false,
          companyId: company.id,
          emailVerificationToken: verificationToken,
        }
      });

      // Update company with owner ID
      await tx.company.update({
        where: { id: company.id },
        data: { ownerId: user.id }
      });

      return { user, company };
    });

    // Prepare email data
    const emailData = {
      firstName,
      lastName,
      email,
      phone: phone || '',
      companyName,
      kvkNumber,
      vatNumber: vatNumber || '',
      address: {
        country: 'Netherlands',
        postalCode: '',
        street: businessAddress,
        city: '',
      }
    };

    // Send emails (don't wait for them to complete)
    Promise.all([
      // Send notification to admin
      sendBusinessRegistrationNotification(emailData),
      // Send confirmation to user
      sendBusinessRegistrationConfirmation(emailData, verificationToken)
    ]).catch(error => {
      console.error('Error sending business registration emails:', error);
      // Don't fail the registration if emails fail
    });

    return NextResponse.json(
      { 
        message: 'Business application submitted successfully. Please check your email for verification instructions.',
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        company: {
          id: result.company.id,
          name: result.company.name,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Business registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
