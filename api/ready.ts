import type { IncomingMessage, ServerResponse } from 'node:http';

export default function handler(_req: IncomingMessage, res: ServerResponse) {
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

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
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
    })
  );
}

