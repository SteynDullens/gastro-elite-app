import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

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

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = document.name.split('.').pop();
    const filename = `kvk-documents/kvk_${kvkNumber}_${timestamp}.${fileExtension}`;

    // Upload to Vercel Blob Storage
    const blob = await put(filename, document, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('✅ Document uploaded to Vercel Blob:', blob.url);

    return NextResponse.json({ 
      success: true, 
      documentPath: blob.url,
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
