import { Router, Request, Response } from 'express';
import multer from 'multer';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomBytes } from 'crypto';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const router = Router();

// Resolve the markitdown binary. Prefer an explicit env override, then PATH,
// then the common pipx/user-install location (the server's PATH may not include
// ~/.local/bin when launched from a GUI/npm context).
function markitdownBin(): string {
  if (process.env.SONNY_MARKITDOWN) return process.env.SONNY_MARKITDOWN;
  return 'markitdown';
}
function markitdownFallback(): string {
  return path.join(os.homedir(), '.local', 'bin', 'markitdown');
}

// Keep the on-disk extension so markitdown can sniff the format. Sanitize hard:
// only the extension is derived from user input, and only [a-z0-9] is allowed.
function safeExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return ext && ext.length <= 8 ? ext : '';
}

async function convertWithMarkitdown(tmpPath: string): Promise<string> {
  const args = [tmpPath];
  const opts = { maxBuffer: 32 * 1024 * 1024 }; // up to 32MB of Markdown
  try {
    const { stdout } = await execFileAsync(markitdownBin(), args, opts);
    return stdout;
  } catch (err: unknown) {
    // Retry against the user-install path if the binary wasn't on PATH.
    const code = (err as { code?: string })?.code;
    if (code === 'ENOENT') {
      const { stdout } = await execFileAsync(markitdownFallback(), args, opts);
      return stdout;
    }
    throw err;
  }
}

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  const fileName = file.originalname;
  const ext = safeExtension(fileName);
  const tmpPath = path.join(os.tmpdir(), `sonny-upload-${randomBytes(8).toString('hex')}${ext}`);

  try {
    await fs.writeFile(tmpPath, file.buffer);
    const markdown = (await convertWithMarkitdown(tmpPath)).trim();

    if (!markdown) {
      return res.status(422).json({
        error: `Could not extract any text from ${fileName}. The file may be empty, scanned, or an unsupported format.`,
      });
    }

    res.json({
      success: true,
      fileName,
      fileType: file.mimetype,
      text: markdown,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const missing = /ENOENT/.test(message);
    console.error('markitdown conversion failed:', message);
    res.status(missing ? 503 : 500).json({
      error: missing
        ? 'Document conversion is unavailable (markitdown not found on the server). Set SONNY_MARKITDOWN to its path.'
        : `Failed to convert ${fileName}.`,
      details: process.env.NODE_ENV === 'development' ? message : undefined,
    });
  } finally {
    await fs.rm(tmpPath, { force: true }).catch(() => { /* best-effort cleanup */ });
  }
});

export default router;
