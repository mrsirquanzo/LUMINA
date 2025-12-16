import type { IncomingMessage, ServerResponse } from 'node:http';

const AUTH_PASSWORD = process.env.AGENT_ACCESS_PASSWORD || 'demo2024';
const SESSION_COOKIE_NAME = 'agent_auth_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function json(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function generateSessionToken(): string {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
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
    if (password !== AUTH_PASSWORD) return json(res, 401, { error: 'Invalid password' });

    const token = generateSessionToken();
    const expires = new Date(Date.now() + SESSION_DURATION_MS);
    const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';

    const cookie = [
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
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

