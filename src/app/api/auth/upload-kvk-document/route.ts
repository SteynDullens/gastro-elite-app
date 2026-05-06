import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const document = formData.get('document') as File;
    const kvkNumber = ((formData.get('kvkNumber') as string) || '').trim();
    
    if (!document) {
      return NextResponse.json({ error: 'No document provided' }, { status: 400 });
    }

    // Validate file type (mime OR filename extension fallback)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const lowerName = (document.name || '').toLowerCase();
    const byExt = lowerName.endsWith('.pdf') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png');
    if (!allowedTypes.includes(document.type) && !byExt) {
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

    const buildBase64Fallback = async () => {
      const bytes = await document.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const mimeType = document.type || 'application/octet-stream';
      const dataUrl = `data:${mimeType};base64,${base64}`;
      const timestamp = Date.now();
      const safeKvkPart = kvkNumber || 'unknown-kvk';
      const documentRef = `base64:${safeKvkPart}:${timestamp}:${document.name}`;
      console.log('✅ Document converted to base64 fallback, size:', base64.length);
      return NextResponse.json({
        success: true,
        documentPath: documentRef,
        documentData: dataUrl,
        message: 'Document uploaded successfully',
      });
    };

    // Check if Vercel Blob is configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const timestamp = Date.now();
        const fileExtension = document.name.split('.').pop();
        const safeKvkPart = kvkNumber || 'unknown-kvk';
        const filename = `kvk-documents/kvk_${safeKvkPart}_${timestamp}.${fileExtension}`;

        const blob = await put(filename, document, {
          access: 'public',
          addRandomSuffix: false,
        });

        console.log('✅ Document uploaded to Vercel Blob:', blob.url);

        return NextResponse.json({
          success: true,
          documentPath: blob.url,
          message: 'Document uploaded successfully',
        });
      } catch (blobError) {
        console.warn('⚠️ Blob upload failed, falling back to base64:', blobError);
        return await buildBase64Fallback();
      }
    }

    // Fallback: Convert to base64 data URL and store reference
    return await buildBase64Fallback();

  } catch (error) {
    console.error('KvK document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
