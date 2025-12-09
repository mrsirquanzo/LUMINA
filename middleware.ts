import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if this is a LUMINA deployment
  // Vercel sets VERCEL_GIT_REPO_SLUG environment variable
  const repoSlug = process.env.VERCEL_GIT_REPO_SLUG || process.env.GIT_REPO_SLUG || '';
  const isLuminaRepo = 
    repoSlug === 'LUMINA' || 
    repoSlug === 'mrsirquanzo/LUMINA' ||
    repoSlug.toLowerCase().includes('lumina');
  
  // Also check hostname as fallback (for LUMINA-specific domains)
  const hostname = request.headers.get('host') || '';
  const isLuminaHostname = hostname.toLowerCase().includes('lumina');
  
  // If deploying from LUMINA repo and accessing root, redirect to /lumina
  if ((isLuminaRepo || isLuminaHostname) && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/lumina', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
