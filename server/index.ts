import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser for authentication (must be before routes)
import cookieParser from 'cookie-parser';
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
import { startIntelligenceJobRunner } from './lib/intelligence/jobRunner';
import { runDigestJob } from './lib/intelligence/digestWorker';

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
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LUMINA Backend Server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

  // Phase 3: resume queued/running digest jobs after restarts
  startIntelligenceJobRunner(async (jobId, payload, entryKey) => {
    await runDigestJob(jobId, payload, entryKey);
  });
});

export default app;
