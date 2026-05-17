import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, verifyPassword, hashPassword } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const user = await safeDbOperation(async (prisma) =>
      prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, password: true },
      })
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Kon gebruiker niet laden. Probeer het later opnieuw.' },
        { status: 503 }
      );
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashedNewPassword = await hashPassword(newPassword);

    const ok = await safeDbOperation(async (prisma) => {
      await prisma.user.update({
        where: { id: decoded.id },
        data: { password: hashedNewPassword },
      });
      return true;
    });

    if (!ok) {
      return NextResponse.json(
        { error: 'Kon wachtwoord niet opslaan. Probeer het later opnieuw.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
