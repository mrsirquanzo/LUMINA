import type { IncomingMessage, ServerResponse } from 'node:http';
import { createSession, getSessionCookieName, verifyPassword } from '../../server/lib/auth';

function json(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) return {};
  return JSON.parse(text);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || 'POST').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readJson(req);
    const password = String(body?.password || '');
    if (!password) return json(res, 400, { error: 'Password is required' });

    if (!verifyPassword(password)) return json(res, 401, { error: 'Invalid password' });

    const { token, expires } = createSession();
    const cookieName = getSessionCookieName();

    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
    const cookie = [
      `${cookieName}=${encodeURIComponent(token)}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      isProd ? 'Secure' : '',
      `Expires=${expires.toUTCString()}`,
    ]
      .filter(Boolean)
      .join('; ');

    res.setHeader('set-cookie', cookie);
    return json(res, 200, { ok: true, expires: expires.toISOString() });
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Login failed' });
  }
}

