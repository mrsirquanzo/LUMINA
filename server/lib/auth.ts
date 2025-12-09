// Simple authentication system for Express

const AUTH_PASSWORD = process.env.AGENT_ACCESS_PASSWORD || 'demo2024';
const SESSION_COOKIE_NAME = 'agent_auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Simple session token generation
function generateSessionToken(): string {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
}

// Check if user is authenticated (Express middleware)
export function isAuthenticated(req: any, res: any, next: any): void {
  // Skip authentication for demo mode
  if (req.body?.isDemo === true || req.query?.isDemo === 'true') {
    return next();
  }

  const session = req.cookies?.[SESSION_COOKIE_NAME];

  if (!session) {
    res.status(401).json({ error: 'Authentication required for live analysis' });
    return;
  }

  // In a real app, verify the session token in a database
  // For simplicity, we're just checking if the cookie exists
  next();
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

// Get session cookie name
export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}
