import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { emailLookupWhere, normalizeEmailForSMTP } from '@/lib/email-address';
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
    const { firstName, lastName, email, phone } = body;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Voornaam, achternaam en e-mail zijn verplicht' },
        { status: 400 }
      );
    }

    const emailNorm = normalizeEmailForSMTP(email);

    const duplicate = await safeDbOperation(async (prisma) =>
      prisma.user.findFirst({
        where: {
          ...emailLookupWhere(email),
          NOT: { id: decoded.id },
        },
        select: { id: true },
      })
    );

    if (duplicate) {
      return NextResponse.json(
        { error: 'Dit e-mailadres is al in gebruik door een ander account' },
        { status: 400 }
      );
    }

    const updated = await safeDbOperation(async (prisma) =>
      prisma.user.update({
        where: { id: decoded.id },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: emailNorm,
          phone: phone?.trim() || '',
        },
        include: {
          ownedCompany: {
            select: {
              id: true,
              name: true,
              status: true,
              rejectionReason: true,
            },
          },
          company: true,
        },
      })
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Kon profiel niet opslaan. Probeer het later opnieuw.' },
        { status: 503 }
      );
    }

    const { password: _, ...userWithoutPassword } = updated;

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: userWithoutPassword,
    });
  } catch (error: unknown) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
