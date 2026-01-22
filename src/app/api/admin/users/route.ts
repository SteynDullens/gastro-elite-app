import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, logError } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';
import { sendPasswordResetNotification } from '@/lib/email';

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
      account_type: user.isAdmin ? 'admin' : (user.ownedCompany ? 'business' : 'user'),
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

    let emailSent = false;
    let emailError: string | null = null;

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
          const { newPassword, generatePassword, sendEmail, userEmail, firstName, lastName } = data;
          
          // Generate password if requested, otherwise use provided password
          let passwordToUse: string;
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
            passwordToUse = generatedPassword.split('').sort(() => Math.random() - 0.5).join('');
          } else {
            if (!newPassword || newPassword.length < 6) {
              throw new Error('New password must be at least 6 characters long');
            }
            passwordToUse = newPassword;
          }
          
          const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(passwordToUse, 12);
          await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
          });

          // Store password for email sending after transaction
          (result as any).passwordToUse = passwordToUse;
          
          break;

        case 'change_role':
          const { newRole } = data;
          if (!['user', 'business', 'admin'].includes(newRole)) {
            throw new Error('Invalid role');
          }
          // Update isAdmin based on role
          await prisma.user.update({
            where: { id: userId },
            data: { isAdmin: newRole === 'admin' }
          });
          break;

        default:
          throw new Error('Invalid action');
      }

      return { success: true };
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Database operation failed' },
        { status: 500 }
      );
    }

    // Send email notification for password reset (after transaction completes)
    if (action === 'reset_password') {
      const { sendEmail, userEmail, firstName, lastName } = data;
      const passwordToUse = (result as any).passwordToUse;
      
      if (sendEmail && userEmail && firstName && lastName && passwordToUse) {
        try {
          console.log(`📧 Attempting to send password reset email to: ${userEmail}`);
          await sendPasswordResetNotification(userEmail, firstName, lastName, passwordToUse);
          emailSent = true;
          console.log(`✅ Password reset email sent successfully to ${userEmail}`);
        } catch (emailErrorCaught: any) {
          emailError = emailErrorCaught.message || 'Unknown email error';
          console.error('❌ Error sending password reset email:', emailErrorCaught);
          console.error('Error code:', emailErrorCaught.code);
          console.error('Error response:', emailErrorCaught.response);
          console.error('Full error:', JSON.stringify(emailErrorCaught, null, 2));
        }
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
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

