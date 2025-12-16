import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../server/app';

// Vercel Serverless Function entrypoint for all `/api/*` routes.
// This keeps the Vite SPA deployment and the Express backend working on the same domain.
export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Express can handle the raw Node request/response objects.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (app as any)(req, res);
}

