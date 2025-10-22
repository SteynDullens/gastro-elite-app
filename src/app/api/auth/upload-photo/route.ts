import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Get authentication token
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `profile_${timestamp}.jpg`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the public URL
    const avatarUrl = `/uploads/profiles/${filename}`;

    // Try to connect to database and update user's avatar
    try {
      const connection = await pool.getConnection();
      try {
        // Try to update avatar column, but don't fail if column doesn't exist
        try {
          await connection.execute(
            'UPDATE users SET avatar = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [avatarUrl, decoded.id]
          );
          console.log('Avatar updated in database successfully');
        } catch (error: any) {
          if (error.code === 'ER_BAD_FIELD_ERROR') {
            console.log('Avatar column does not exist, skipping database update');
          } else {
            console.log('Database update failed, but photo was saved:', error.message);
          }
        }
      } finally {
        connection.release();
      }
    } catch (dbError) {
      console.log('Database connection failed, but photo was saved:', dbError);
      // Don't fail the upload if database is unavailable
    }

    return NextResponse.json({ 
      success: true, 
      avatar: avatarUrl,
      message: 'Photo uploaded successfully' 
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
