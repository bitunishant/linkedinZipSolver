import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Return the data URL and filename
    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      fileName: file.name,
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
