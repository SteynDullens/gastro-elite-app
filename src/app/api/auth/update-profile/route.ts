import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { emailLookupWhere, normalizeEmailForSMTP } from '@/lib/email-address';
import { safeDbOperation } from '@/lib/prisma';

const USER_INCLUDE = {
  ownedCompany: {
    select: {
      id: true,
      name: true,
      status: true,
      rejectionReason: true,
    },
  },
  company: true,
} as const;

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
    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      postalCode,
      street,
      city,
      preferredLanguage,
      pushNotifications,
      emailNotifications,
    } = body;

    const touchesProfile =
      firstName !== undefined ||
      lastName !== undefined ||
      email !== undefined ||
      phone !== undefined ||
      country !== undefined ||
      postalCode !== undefined ||
      street !== undefined ||
      city !== undefined;

    if (touchesProfile) {
      if (!String(firstName ?? '').trim() || !String(lastName ?? '').trim() || !String(email ?? '').trim()) {
        return NextResponse.json(
          { error: 'Voornaam, achternaam en e-mail zijn verplicht' },
          { status: 400 }
        );
      }
    }

    let emailNorm: string | undefined;
    if (email !== undefined) {
      emailNorm = normalizeEmailForSMTP(email);
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
    }

    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = String(firstName).trim();
    if (lastName !== undefined) data.lastName = String(lastName).trim();
    if (emailNorm !== undefined) data.email = emailNorm;
    if (phone !== undefined) data.phone = String(phone).trim();
    if (country !== undefined) data.country = String(country).trim() || null;
    if (postalCode !== undefined) data.postalCode = String(postalCode).trim() || null;
    if (street !== undefined) data.street = String(street).trim() || null;
    if (city !== undefined) data.city = String(city).trim() || null;
    if (preferredLanguage !== undefined) {
      const lang = String(preferredLanguage).trim();
      if (lang) data.preferredLanguage = lang;
    }
    if (typeof pushNotifications === 'boolean') data.pushNotifications = pushNotifications;
    if (typeof emailNotifications === 'boolean') data.emailNotifications = emailNotifications;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Geen wijzigingen opgegeven' }, { status: 400 });
    }

    const updated = await safeDbOperation(async (prisma) =>
      prisma.user.update({
        where: { id: decoded.id },
        data,
        include: USER_INCLUDE,
      })
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Kon gegevens niet opslaan. Probeer het later opnieuw.' },
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
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
