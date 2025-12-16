import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Load environment variables (safe no-op on Vercel if not present)
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    // Same-origin requests won't need CORS, but this keeps local dev + preview deployments working.
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Import route handlers
import orchestratorRoutes from './api/agents/orchestrator';
import uploadRoutes from './api/upload';
import fetchUrlRoutes from './api/fetch-url';
import individualAgentRoutes from './api/agents';
import authLoginRoutes from './api/auth/login';
import authCheckRoutes from './api/auth/check';
import targetBiologyRoutes from './api/agents/target-biology';
import patentParsingRoutes from './api/patent-parsing';
import intelligenceFeedRoutes from './api/intelligence/feed';
import intelligenceUnreadRoutes from './api/intelligence/unread';
import intelligenceMarkSeenRoutes from './api/intelligence/mark-seen';
import intelligenceDigestRoutes from './api/intelligence/digest';
import intelligenceDigestJobsRoutes from './api/intelligence/digest-jobs';

// Routes
app.use('/api/agents/orchestrator', orchestratorRoutes);
app.use('/api/agents', individualAgentRoutes);
app.use('/api/agents/target-biology', targetBiologyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/fetch-url', fetchUrlRoutes);
app.use('/api/auth/login', authLoginRoutes);
app.use('/api/auth/check', authCheckRoutes);
app.use('/api/patent-parsing', patentParsingRoutes);
app.use('/api/intelligence/feed', intelligenceFeedRoutes);
app.use('/api/intelligence/unread', intelligenceUnreadRoutes);
app.use('/api/intelligence/mark-seen', intelligenceMarkSeenRoutes);
app.use('/api/intelligence/digest', intelligenceDigestRoutes);
app.use('/api/intelligence/digest-jobs', intelligenceDigestJobsRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;

