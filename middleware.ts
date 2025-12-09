import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if this is a LUMINA deployment
  // Method 1: Explicit environment variable (most reliable)
  const isLuminaEnv = process.env.NEXT_PUBLIC_LUMINA_DEPLOYMENT === 'true' || 
                     process.env.LUMINA_DEPLOYMENT === 'true';
  
  // Method 2: Vercel sets VERCEL_GIT_REPO_SLUG environment variable
  const repoSlug = process.env.VERCEL_GIT_REPO_SLUG || process.env.GIT_REPO_SLUG || '';
  const isLuminaRepo = 
    repoSlug === 'LUMINA' || 
    repoSlug === 'mrsirquanzo/LUMINA' ||
    repoSlug.toLowerCase().includes('lumina');
  
  // Method 3: Check hostname as fallback (for LUMINA-specific domains)
  const hostname = request.headers.get('host') || '';
  const isLuminaHostname = hostname.toLowerCase().includes('lumina');
  
  // If deploying from LUMINA repo and accessing root, redirect to /lumina
  if ((isLuminaEnv || isLuminaRepo || isLuminaHostname) && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/lumina', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
