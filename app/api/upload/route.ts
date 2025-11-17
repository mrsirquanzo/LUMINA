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

        // Convert buffer to string
        const pdfString = buffer.toString('latin1');

        // Extract text from PDF streams - look for BT...ET blocks (text objects)
        const textBlocks: string[] = [];

        // Match text between BT (Begin Text) and ET (End Text) markers
        // Use [\s\S] instead of . with s flag for older ES versions
        const btEtRegex = /BT([\s\S]*?)ET/g;
        let match;

        while ((match = btEtRegex.exec(pdfString)) !== null) {
          const textBlock = match[1];
          // Extract strings in parentheses (actual text content)
          const strings = textBlock.match(/\(([^)]+)\)/g);
          if (strings) {
            const cleanedStrings = strings
              .map(s => s.slice(1, -1)) // Remove parentheses
              .filter(s => {
                // Filter out binary garbage and keep only readable text
                // Check if string has mostly printable ASCII characters
                const printableChars = s.split('').filter(c => {
                  const code = c.charCodeAt(0);
                  return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9;
                }).length;
                return printableChars / s.length > 0.7; // At least 70% printable
              })
              .map(s =>
                s.replace(/\\n/g, '\n')
                 .replace(/\\r/g, '\r')
                 .replace(/\\t/g, '\t')
                 .replace(/\\/g, '')
              );

            textBlocks.push(...cleanedStrings);
          }
        }

        extractedText = textBlocks.join(' ').trim();

        // If no text found or too much garbage, return a message
        if (!extractedText || extractedText.length < 100) {
          extractedText = `PDF file uploaded: ${fileName} (${(file.size / 1024).toFixed(2)} KB).\n\nNote: Automated text extraction failed for this PDF. This may be because:\n- The PDF contains scanned images requiring OCR\n- The PDF uses complex encoding\n- The PDF is password protected\n\nYou can still ask questions, and I'll do my best to help based on the filename and context.`;
        }

        console.log(`PDF processed, extracted ${extractedText.length} characters of readable text`);
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
