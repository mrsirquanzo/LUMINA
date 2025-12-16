import type { IncomingMessage, ServerResponse } from 'node:http';

const SESSION_COOKIE_NAME = 'agent_auth_session';

function json(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if ((req.method || 'GET').toUpperCase() !== 'GET') {
    res.statusCode = 405;
    res.setHeader('allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers.cookie);
  const authenticated = Boolean(cookies?.[SESSION_COOKIE_NAME]);
  return json(res, 200, { authenticated });
}

