import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieName } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear the session cookie
  response.cookies.delete(getSessionCookieName());

  return response;
}
