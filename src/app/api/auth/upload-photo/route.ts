import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { uploadImageToBlob, extensionFromMime } from '@/lib/blob-upload';
import { safeDbOperation } from '@/lib/prisma';

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ error: 'Ongeldige sessie' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/') && !file.name) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Bestand te groot (max ${Math.floor(MAX_BYTES / (1024 * 1024))} MB)` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = extensionFromMime(file.type, file.name);
    const contentType = file.type?.trim() || `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const upload = await uploadImageToBlob(
      'profile-photos',
      buffer,
      contentType,
      ext
    );

    if (!upload.ok) {
      return NextResponse.json({ error: upload.error }, { status: 500 });
    }

    const avatarUrl = upload.url;

    const updated = await safeDbOperation(async (prisma) =>
      prisma.user.update({
        where: { id: decoded.id },
        data: { avatarUrl },
        select: { id: true, avatarUrl: true },
      })
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Foto geüpload maar kon niet in database worden opgeslagen.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      avatar: avatarUrl,
      message: 'Photo uploaded successfully',
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
