import { Router, Request, Response } from 'express';
import { verifyPassword, createSession, getSessionCookieName } from '../../lib/auth';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Verify password
    if (!verifyPassword(password)) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Create session
    const { token, expires } = createSession();

    // Set cookie
    res.cookie(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });

    return res.status(200).json({ success: true, message: 'Authentication successful' });

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'An error occurred during login',
      details: error.message,
    });
  }
});

export default router;
