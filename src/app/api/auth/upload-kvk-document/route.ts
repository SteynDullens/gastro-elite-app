import { NextRequest, NextResponse } from 'next/server';

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

    // Check if Vercel Blob is configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Use Vercel Blob Storage
      const { put } = await import('@vercel/blob');
      
      const timestamp = Date.now();
      const fileExtension = document.name.split('.').pop();
      const filename = `kvk-documents/kvk_${kvkNumber}_${timestamp}.${fileExtension}`;

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
    } else {
      // Fallback: Convert to base64 data URL and store reference
      // This works for serverless but document will be stored as data URL
      const bytes = await document.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const mimeType = document.type;
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      // For production, we'll store a reference that indicates it's a base64 document
      // The actual data will be stored in the company record
      const timestamp = Date.now();
      const documentRef = `base64:${kvkNumber}:${timestamp}:${document.name}`;
      
      console.log('✅ Document converted to base64, size:', base64.length);

      return NextResponse.json({ 
        success: true, 
        documentPath: documentRef,
        documentData: dataUrl, // Include the actual data for storage
        message: 'Document uploaded successfully' 
      });
    }

  } catch (error) {
    console.error('KvK document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
