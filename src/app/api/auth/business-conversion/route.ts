import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPrisma } from '@/lib/prisma';
import {
  sendBusinessRegistrationConfirmation,
  sendBusinessRegistrationNotification,
} from '@/lib/email';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim();
  if (!token) {
    return NextResponse.json({ success: false, error: 'Token ontbreekt' }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ success: false, error: 'Database niet bereikbaar' }, { status: 503 });
  }

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token, deletedAt: null },
    include: { ownedCompany: true },
  });

  if (!user || !user.ownedCompany || user.ownedCompany.status !== 'draft_kvk') {
    return NextResponse.json({ success: false, error: 'Ongeldige of verlopen conversielink' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      companyName: user.ownedCompany.name,
      kvkNumber: user.ownedCompany.kvkNumber,
      vatNumber: user.ownedCompany.vatNumber || '',
      companyPhone: user.ownedCompany.companyPhone || '',
      address: user.ownedCompany.address || '',
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = body?.token?.trim();
  const kvkDocumentPath = body?.kvkDocumentPath?.trim();
  const kvkDocumentData = body?.kvkDocumentData;
  const companyName = body?.companyName?.trim();
  const kvkNumber = body?.kvkNumber?.trim();
  const vatNumber = body?.vatNumber?.trim();
  const companyPhone = body?.companyPhone?.trim();
  const address = body?.address?.trim();

  if (!token || !kvkDocumentPath) {
    return NextResponse.json(
      { success: false, error: 'Token en KvK-document zijn verplicht' },
      { status: 400 }
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ success: false, error: 'Database niet bereikbaar' }, { status: 503 });
  }

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token, deletedAt: null },
    include: { ownedCompany: true },
  });

  if (!user || !user.ownedCompany || user.ownedCompany.status !== 'draft_kvk') {
    return NextResponse.json({ success: false, error: 'Ongeldige of verlopen conversielink' }, { status: 404 });
  }

  if (!companyName || !kvkNumber) {
    return NextResponse.json(
      { success: false, error: 'Bedrijfsnaam en KvK-nummer zijn verplicht.' },
      { status: 400 }
    );
  }

  const company = await prisma.company.update({
    where: { id: user.ownedCompany.id },
    data: {
      name: companyName,
      kvkNumber,
      vatNumber: vatNumber || null,
      companyPhone: companyPhone || null,
      address: address || '',
      kvkDocumentPath,
      kvkDocumentData: kvkDocumentData || null,
      status: 'pending',
    },
  });

  const verificationToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: verificationToken,
      emailVerified: false,
      emailVerifiedAt: null,
    },
  });

  await sendBusinessRegistrationNotification(
    {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      companyName: company.name,
      kvkNumber: company.kvkNumber,
      vatNumber: company.vatNumber || undefined,
      companyPhone: company.companyPhone || undefined,
      address: {
        country: 'Nederland',
        postalCode: '',
        street: company.address || '',
        city: '',
      },
    },
    company.kvkDocumentPath || undefined,
    company.kvkDocumentData || undefined,
    company.id
  );

  await sendBusinessRegistrationConfirmation(
    {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      companyName: company.name,
      kvkNumber: company.kvkNumber,
      vatNumber: company.vatNumber || undefined,
      companyPhone: company.companyPhone || undefined,
      address: {
        country: 'Nederland',
        postalCode: '',
        street: company.address || '',
        city: '',
      },
    },
    verificationToken
  );

  return NextResponse.json({
    success: true,
    message:
      'KvK-document is ontvangen. Je aanvraag staat nu op pending en de verificatie-e-mail is verzonden.',
  });
}
