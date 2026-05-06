import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { safeDbOperation } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const companyId = typeof body?.companyId === 'string' ? body.companyId : undefined;

    const result = await safeDbOperation(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          ownedCompany: true,
          companyMemberships: true,
        },
      });

      if (!user) throw new Error('Gebruiker niet gevonden');
      if (user.ownedCompany) {
        throw new Error('Bedrijfseigenaren kunnen zichzelf niet ontkoppelen van hun eigen bedrijf.');
      }

      const targetCompanyId = companyId || user.companyId || user.companyMemberships[0]?.companyId;
      if (!targetCompanyId) {
        throw new Error('Geen gekoppeld bedrijf gevonden.');
      }

      await prisma.companyMembership.deleteMany({
        where: {
          userId: user.id,
          companyId: targetCompanyId,
        },
      });

      if (user.companyId === targetCompanyId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { companyId: null },
        });
      }

      return { success: true };
    });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Database operation failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Ontkoppelen mislukt' },
      { status: 400 }
    );
  }
}
