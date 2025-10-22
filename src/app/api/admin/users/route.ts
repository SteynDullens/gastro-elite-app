import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, logError } from '@/lib/auth';
import mysql from 'mysql2/promise';

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

    if (!decoded || decoded.account_type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const connection = await mysql.createConnection({
      host: 'web0166.zxcs.nl',
      user: 'u196042p358967_Gastroelite',
      password: '!Janssenstraat1211',
      database: 'u196042p358967_Gastroelite',
      port: 3306
    });

    try {
      const [users] = await connection.execute(`
        SELECT u.id, u.email, u.firstName, u.lastName, u.phone, u.account_type, 
               u.isActive, u.emailVerified, u.createdAt, u.updatedAt,
               c.company_name as companyName
        FROM users u
        LEFT JOIN companies c ON u.companyId = c.id
        ORDER BY u.createdAt DESC
      `);

      return NextResponse.json({
        success: true,
        users
      });

    } finally {
      await connection.end();
    }

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

    if (!decoded || decoded.account_type !== 'admin') {
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

    const connection = await mysql.createConnection({
      host: 'web0166.zxcs.nl',
      user: 'u196042p358967_Gastroelite',
      password: '!Janssenstraat1211',
      database: 'u196042p358967_Gastroelite',
      port: 3306
    });

    try {
      switch (action) {
        case 'toggle_active':
          await connection.execute(
            'UPDATE users SET isActive = NOT isActive, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
          );
          break;

        case 'reset_password':
          const { newPassword } = data;
          if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
              { error: 'New password must be at least 6 characters long' },
              { status: 400 }
            );
          }
          const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(newPassword, 12);
          await connection.execute(
            'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, userId]
          );
          break;

        case 'change_role':
          const { newRole } = data;
          if (!['user', 'business', 'admin'].includes(newRole)) {
            return NextResponse.json(
              { error: 'Invalid role' },
              { status: 400 }
            );
          }
          await connection.execute(
            'UPDATE users SET account_type = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [newRole, userId]
          );
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
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

    } finally {
      await connection.end();
    }

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

