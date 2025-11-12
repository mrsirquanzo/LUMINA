import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Import pdf-parse using require (CommonJS)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
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
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdf(buffer);
      extractedText = data.text;

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
    console.error('File processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process file' },
      { status: 500 }
    );
  }
}
