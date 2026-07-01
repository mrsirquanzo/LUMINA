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
import intelligenceArticleAnalysisRoutes from './api/intelligence/article-analysis';
import deepResearchRoutes from './api/agents/deepResearch';

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
app.use('/api/intelligence/article-analysis', intelligenceArticleAnalysisRoutes);
app.use('/api/agents/deep-research', deepResearchRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Readiness check (useful for Live-mode gating in the UI)
app.get('/api/ready', (_req: Request, res: Response) => {
  const requiredKeys = {
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    GOOGLE_API_KEY: Boolean(process.env.GOOGLE_API_KEY),
    PERPLEXITY_API_KEY: Boolean(process.env.PERPLEXITY_API_KEY),
  };

  const optional = {
    MCP_ENABLED: process.env.MCP_ENABLED === 'true',
    PUBMED_API_KEY: Boolean(process.env.PUBMED_API_KEY || process.env.NCBI_API_KEY),
    FINANCIAL_API_KEY: Boolean(process.env.FINANCIAL_API_KEY),
    MARKET_DATA_API_KEY: Boolean(process.env.MARKET_DATA_API_KEY),
    PATENT_API_KEY: Boolean(process.env.PATENT_API_KEY),
    GOSSET_OAUTH_TOKEN: Boolean(process.env.GOSSET_OAUTH_TOKEN),
  };

  const missing = Object.entries(requiredKeys)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);

  res.json({
    ok: missing.length === 0,
    missing,
    requiredKeys,
    optional,
    build: {
      vercelCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      vercelRepo: process.env.VERCEL_GIT_REPO_SLUG || null,
      nodeEnv: process.env.NODE_ENV || null,
    },
    timestamp: new Date().toISOString(),
  });
});

export default app;

