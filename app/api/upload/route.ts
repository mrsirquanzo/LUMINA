import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Import pdf-parse using require (CommonJS)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Configure route for file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for Vercel

export async function POST(req: NextRequest) {
  console.log('=== Upload API Called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const fileType = file.type;
    const fileName = file.name;
    let extractedText = '';
    let structuredData: any = null;

    // Process based on file type
    if (fileType === 'application/pdf') {
      // PDF Processing
      console.log(`Processing PDF: ${fileName}, size: ${file.size} bytes`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log('PDF buffer created, parsing...');
        const data = await pdf(buffer);
        extractedText = data.text;
        console.log(`PDF parsed successfully, extracted ${extractedText.length} characters`);
      } catch (pdfError: any) {
        console.error('PDF parsing error:', pdfError);
        throw new Error(`PDF parsing failed: ${pdfError.message || 'Unknown error'}`);
      }

    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel'
    ) {
      // Excel Processing
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Convert all sheets to text
      const sheets: string[] = [];
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        sheets.push(`\n--- Sheet: ${sheetName} ---\n${csvText}`);
      });

      extractedText = sheets.join('\n\n');

      // Also provide structured data for first sheet
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      structuredData = XLSX.utils.sheet_to_json(firstSheet);

    } else if (fileType === 'text/csv') {
      // CSV Processing
      const text = await file.text();

      Papa.parse(text, {
        header: true,
        complete: (results) => {
          structuredData = results.data;
          // Convert to readable text
          extractedText = Papa.unparse(results.data);
        },
      });

    } else if (fileType === 'text/plain') {
      // Plain Text
      extractedText = await file.text();

    } else if (fileType.startsWith('image/')) {
      // Image Processing - convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      return NextResponse.json({
        success: true,
        fileName,
        fileType,
        isImage: true,
        base64,
        mimeType: fileType,
      });

    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileType}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName,
      fileType,
      text: extractedText,
      structuredData,
      isImage: false,
    });

  } catch (error: any) {
    console.error('File processing error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Provide more specific error message
    const errorMessage = error.message || 'Failed to process file';
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
