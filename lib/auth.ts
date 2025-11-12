// Simple authentication system for protecting AI agent access
import { cookies } from 'next/headers';

// Store password in environment variable
// For demo: Use a simple password. In production, use proper auth (Auth0, NextAuth, etc.)
const AUTH_PASSWORD = process.env.AGENT_ACCESS_PASSWORD || 'demo2024';
const SESSION_COOKIE_NAME = 'agent_auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Simple session token generation
function generateSessionToken(): string {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
}

// Check if user is authenticated (server-side)
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  if (!session) {
    return false;
  }

  // In a real app, verify the session token in a database
  // For simplicity, we're just checking if the cookie exists and hasn't expired
  return true;
}

// Verify password and create session
export function verifyPassword(password: string): boolean {
  return password === AUTH_PASSWORD;
}

// Create session cookie value
export function createSession(): { token: string; expires: Date } {
  const token = generateSessionToken();
  const expires = new Date(Date.now() + SESSION_DURATION);

  return { token, expires };
}

// Get session cookie name (for client-side access)
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}
