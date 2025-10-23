import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const document = formData.get('document') as File;
    const kvkNumber = formData.get('kvkNumber') as string;
    
    if (!document) {
      return NextResponse.json({ error: 'No document provided' }, { status: 400 });
    }

    if (!kvkNumber) {
      return NextResponse.json({ error: 'KvK number is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(document.type)) {
      return NextResponse.json({ 
        error: 'Only PDF, JPG and PNG files are allowed' 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (document.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB' 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'kvk-documents');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = document.name.split('.').pop();
    const filename = `kvk_${kvkNumber}_${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await document.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the public URL
    const documentUrl = `/uploads/kvk-documents/${filename}`;

    return NextResponse.json({ 
      success: true, 
      documentPath: documentUrl,
      message: 'Document uploaded successfully' 
    });

  } catch (error) {
    console.error('KvK document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}




