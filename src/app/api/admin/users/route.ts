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
              name: true
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
          const { newPassword, sendEmail, userEmail, firstName, lastName } = data;
          if (!newPassword || newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long');
          }
          const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(newPassword, 12);
          await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
          });

          // Send email notification if requested
          if (sendEmail && userEmail && firstName && lastName) {
            try {
              await sendPasswordResetNotification(userEmail, firstName, lastName, newPassword);
              console.log(`✅ Password reset email sent to ${userEmail}`);
            } catch (emailError) {
              console.error('Error sending password reset email:', emailError);
              // Don't fail the request if email fails
            }
          }
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

    // Log admin action
    await logError({
      level: 'info',
      message: `Admin action: ${action} performed on user ID: ${userId}`,
      userId: decoded.id,
      url: request.url,
      method: 'PUT'
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });

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

