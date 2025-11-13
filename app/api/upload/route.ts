import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

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
      // PDF Processing - simplified text extraction
      console.log(`Processing PDF: ${fileName}, size: ${file.size} bytes`);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert buffer to string and extract visible text
        // This is a simplified approach that extracts basic text content
        const pdfString = buffer.toString('binary');

        // Extract text between stream objects (simplified PDF text extraction)
        const textMatches = pdfString.match(/\(([^)]+)\)/g);
        if (textMatches) {
          extractedText = textMatches
            .map(match => match.slice(1, -1)) // Remove parentheses
            .join(' ')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .trim();
        }

        // If no text found, return a message
        if (!extractedText) {
          extractedText = `PDF file uploaded: ${fileName} (${(file.size / 1024).toFixed(2)} KB). Text extraction requires OCR or advanced parsing.`;
        }

        console.log(`PDF processed, extracted ${extractedText.length} characters`);
      } catch (pdfError: any) {
        console.error('PDF processing error:', pdfError);
        // Don't fail completely - just note that we have the file
        extractedText = `PDF file uploaded: ${fileName} (${(file.size / 1024).toFixed(2)} KB). Advanced text extraction not available.`;
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
