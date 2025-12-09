import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const router = Router();

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileType = file.mimetype;
    const fileName = file.originalname;
    let extractedText = '';
    let structuredData: any = null;

    // Process based on file type
    if (fileType === 'application/pdf') {
      // PDF Processing - simplified text extraction
      try {
        const buffer = file.buffer;
        const pdfString = buffer.toString('latin1');

        // Extract text from PDF streams
        const textBlocks: string[] = [];
        const btEtRegex = /BT([\s\S]*?)ET/g;
        let match;

        while ((match = btEtRegex.exec(pdfString)) !== null) {
          const textBlock = match[1];
          const strings = textBlock.match(/\(([^)]+)\)/g);
          if (strings) {
            const cleanedStrings = strings
              .map(s => s.slice(1, -1))
              .filter(s => {
                const printableChars = s.split('').filter(c => {
                  const code = c.charCodeAt(0);
                  return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9;
                }).length;
                return printableChars / s.length > 0.7;
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

        if (!extractedText || extractedText.length < 100) {
          extractedText = `PDF file uploaded: ${fileName} (${(file.size / 1024).toFixed(2)} KB).\n\nNote: Automated text extraction failed for this PDF.`;
        }
      } catch (pdfError: any) {
        extractedText = `PDF file uploaded: ${fileName} (${(file.size / 1024).toFixed(2)} KB). Advanced text extraction not available.`;
      }

    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel'
    ) {
      // Excel Processing
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheets: string[] = [];
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        sheets.push(`\n--- Sheet: ${sheetName} ---\n${csvText}`);
      });

      extractedText = sheets.join('\n\n');
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      structuredData = XLSX.utils.sheet_to_json(firstSheet);

    } else if (fileType === 'text/csv') {
      // CSV Processing
      const text = file.buffer.toString('utf-8');
      Papa.parse(text, {
        header: true,
        complete: (results) => {
          structuredData = results.data;
          extractedText = Papa.unparse(results.data);
        },
      });

    } else if (fileType === 'text/plain') {
      // Plain Text
      extractedText = file.buffer.toString('utf-8');

    } else if (fileType.startsWith('image/')) {
      // Image Processing - convert to base64
      const base64 = file.buffer.toString('base64');

      return res.json({
        success: true,
        fileName,
        fileType,
        isImage: true,
        base64,
        mimeType: fileType,
      });

    } else {
      return res.status(400).json({ error: `Unsupported file type: ${fileType}` });
    }

    res.json({
      success: true,
      fileName,
      fileType,
      text: extractedText,
      structuredData,
      isImage: false,
    });

  } catch (error: any) {
    console.error('File processing error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process file',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
