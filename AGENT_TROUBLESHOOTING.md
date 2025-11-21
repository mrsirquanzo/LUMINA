# Agent System Troubleshooting Guide

**Date:** November 21, 2025
**Issue:** API Configuration Error on Patent Expert Agent (Live Mode)

## Problem Diagnosis

### Error Message
```
API configuration error. Please contact support.
```

### Root Cause
The error occurs because **environment variables for API keys are not configured**. Specifically:

- The system has only `.env.example` (template file)
- **Missing:** `.env.local` (actual configuration file with API keys)

### Affected Agents

| Agent | Provider | API Key Required | Status |
|-------|----------|-----------------|--------|
| **Patent Expert** | Perplexity | `PERPLEXITY_API_KEY` | ❌ **Missing** (causing error) |
| **Market Research** | Perplexity | `PERPLEXITY_API_KEY` | ❌ Missing |
| **Clinical Data Analyst** | Anthropic | `ANTHROPIC_API_KEY` | ❌ Missing |
| **Regulatory Expert** | Anthropic | `ANTHROPIC_API_KEY` | ❌ Missing |
| **Financial Analyst** | Google | `GOOGLE_API_KEY` | ❌ Missing |

---

## Solution: Configure API Keys

### Step 1: Create `.env.local` File

Copy the example file to create your local environment configuration:

```bash
cd /home/user/Quan_project
cp .env.example .env.local
```

### Step 2: Obtain API Keys

#### Required API Keys (for all agents to work):

1. **Anthropic API Key** (for Clinical + Regulatory agents)
   - Website: https://console.anthropic.com/settings/keys
   - Cost: Pay-as-you-go (~$15/million input tokens)
   - Used by: Clinical Data Analyst, Regulatory Expert

2. **Perplexity API Key** (for Patent + Market agents)
   - Website: https://www.perplexity.ai/settings/api
   - Cost: Pay-as-you-go (~$5/million tokens)
   - **CRITICAL:** This is the missing key causing your current error
   - Used by: Patent Expert, Market Research Agent

3. **Google Gemini API Key** (for Financial agent)
   - Website: https://aistudio.google.com/app/apikey
   - Cost: Free tier available (2 million tokens/day)
   - Used by: Financial Analyst

### Step 3: Edit `.env.local` with Your Keys

Open `.env.local` and replace the placeholder values:

```bash
# Required for Patent Expert & Market Research
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Required for Clinical & Regulatory agents
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Required for Financial Analyst
GOOGLE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Authentication password for Live Mode
AGENT_ACCESS_PASSWORD=demo2024
```

### Step 4: Restart Development Server

After adding API keys, restart your Next.js server:

```bash
# If running locally:
npm run dev

# If running in production:
npm run build
npm start
```

---

## Verification

### Check 1: Test API Keys Endpoint

```bash
curl http://localhost:3000/api/agents/check-api-keys
```

**Expected Output (after configuration):**
```json
{
  "configured": true,
  "missingKeys": [],
  "hasAnthropicKey": true,
  "hasGoogleKey": true,
  "hasPerplexityKey": true
}
```

**Current Output (before configuration):**
```json
{
  "configured": false,
  "missingKeys": [
    "ANTHROPIC_API_KEY",
    "GOOGLE_API_KEY",
    "PERPLEXITY_API_KEY"
  ],
  "hasAnthropicKey": false,
  "hasGoogleKey": false,
  "hasPerplexityKey": false
}
```

### Check 2: Test Patent Expert Agent

After configuring `PERPLEXITY_API_KEY`:

1. Log in to Live Mode on Patent Expert Agent page
2. Try your original query:
   ```
   Compare the ADC patent portfolios of Daiichi Sankyo, AstraZeneca, and Seagen. Who has the strongest position?
   ```
3. Should receive real-time patent analysis (not error)

---

## Additional Configuration (Optional)

### MCP Server (Model Context Protocol)

For enhanced real-time data access, enable MCP in `.env.local`:

```bash
MCP_ENABLED=true

# Optional: Enhanced data sources
PUBMED_API_KEY=your_pubmed_key
FINANCIAL_API_KEY=your_alphavantage_key
MARKET_DATA_API_KEY=your_news_api_key
```

**Benefits of MCP:**
- Real-time patent searches via USPTO/Google Patents
- Live market intelligence and competitor data
- Enhanced PubMed clinical trial lookups
- Real-time stock and financial data

**Without MCP:**
- Agents still work with Perplexity's built-in real-time search
- No live patent database integration
- Reduced data freshness for financial metrics

---

## Cost Estimate

### Live Mode Usage Costs (per query):

| Agent | Model | Cost per Query | Tokens Used |
|-------|-------|---------------|-------------|
| Patent Expert | Perplexity Sonar Pro | $0.01-0.10 | ~1,000-10,000 |
| Market Research | Perplexity Sonar Pro | $0.01-0.10 | ~1,000-10,000 |
| Clinical Analyst | Claude Sonnet 4 | $0.02-0.15 | ~2,000-10,000 |
| Regulatory Expert | Claude Sonnet 4 | $0.02-0.15 | ~2,000-10,000 |
| Financial Analyst | Gemini 2.0 Flash | $0.00-0.01 | ~1,000-5,000 |

**Multi-Agent Analysis (5 agents in parallel):** ~$0.10-0.50 per analysis

**Demo Mode:** Always free (uses pre-recorded responses)

---

## Common Issues

### Issue 1: "API configuration error" on individual agents but multi-agent works ⭐ NEW

**Symptom:** Multi-agent orchestrator works fine, but individual agents (Patent Expert, Market Research, Financial Analyst) fail with "API configuration error. Please contact support."

**Cause:** Missing Next.js runtime configuration causing Edge runtime or caching issues

**Solution:** ✅ **FIXED IN LATEST VERSION**

All individual agent routes now include:
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

**If you still see this issue after updating:**
1. **Pull latest changes:** `git pull origin main`
2. **Clear Next.js cache:** `rm -rf .next`
3. **Restart server:** `npm run dev`

**Technical Details:**
- Without explicit runtime config, Next.js may use Edge runtime
- Edge runtime has limited `process.env` access for security
- Cached responses may return stale "no API key" errors
- Now all routes explicitly use Node.js runtime with dynamic rendering
- This ensures consistent behavior between orchestrator and individual agents

**Fixed Routes:**
- ✅ `app/api/agents/patent-expert/route.ts`
- ✅ `app/api/agents/market-research/route.ts`
- ✅ `app/api/agents/financial-analyst/route.ts`
- ✅ `app/api/agents/data-analyst/route.ts`
- ✅ `app/api/agents/regulatory-expert/route.ts` (already had config)

### Issue 2: "Authentication required" error

**Cause:** Not logged in to Live Mode
**Solution:** Click "🚀 Live AI Agent" button and enter password (default: `demo2024`)

### Issue 3: "API configuration error" persists after adding keys

**Cause:** Server not restarted after `.env.local` changes
**Solution:** Restart Next.js dev server:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Issue 4: "Invalid API key" error

**Cause:** API key is incorrect or expired
**Solution:**
1. Verify key format matches provider requirements
2. Check for extra spaces or line breaks
3. Regenerate key from provider console

### Issue 5: "Rate limit exceeded" error

**Cause:** Too many requests in short time period
**Solution:**
1. Wait 60 seconds and try again
2. Upgrade API plan with provider
3. Use Demo Mode for testing

---

## Security Best Practices

1. **Never commit `.env.local` to Git**
   - Already in `.gitignore`
   - Contains sensitive API keys

2. **Rotate API keys regularly**
   - Every 3-6 months
   - Immediately if exposed

3. **Use environment-specific keys**
   - Development: Low-cost test keys
   - Production: Full-access keys with monitoring

4. **Monitor usage and costs**
   - Set up billing alerts with providers
   - Track per-agent costs using provider dashboards

---

## Agent System Architecture

### Multi-Model System Design

```
User Query → Agent Router → Specialized Agent → LLM Provider → Response

Agent Types:
├── Clinical Data Analyst → Claude Sonnet 4 (Anthropic)
├── Patent Expert → Perplexity Sonar Pro (Perplexity)
├── Market Research → Perplexity Sonar Pro (Perplexity)
├── Financial Analyst → Gemini 2.0 Flash (Google)
└── Regulatory Expert → Claude Sonnet 4 (Anthropic)

All responses → Synthesis Agent → Claude Sonnet 4 → Unified Analysis
```

### Why Multi-Model Architecture?

- **Claude Sonnet 4:** Best reasoning for complex clinical/regulatory pathways
- **Perplexity Sonar Pro:** Real-time web search for patents and market data
- **Gemini 2.0 Flash:** Fast, cost-effective, large context for financial analysis

### API Route Structure

```
/api/agents/
├── patent-expert/route.ts (Perplexity)
├── market-research/route.ts (Perplexity)
├── financial-analyst/route.ts (Google Gemini)
├── regulatory-expert/route.ts (Anthropic)
├── clinical-analyst/route.ts (Anthropic)
├── orchestrator/route.ts (Multi-agent coordination)
└── check-api-keys/route.ts (Diagnostics)
```

---

## Support

If you continue to experience issues after following this guide:

1. **Check server logs:**
   ```bash
   # View Next.js server console output
   # Look for detailed error messages
   ```

2. **Test individual API keys:**
   ```bash
   # Test Perplexity API
   curl https://api.perplexity.ai/chat/completions \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"sonar","messages":[{"role":"user","content":"test"}]}'
   ```

3. **Verify environment variables are loaded:**
   ```bash
   # In Next.js, check server console for:
   console.log('PERPLEXITY_API_KEY set:', !!process.env.PERPLEXITY_API_KEY)
   ```

4. **Open GitHub issue:**
   - Repository: https://github.com/mrsirquanzo/Quan_project
   - Include: Error message, agent type, mode (demo/live)

---

## Quick Fix Summary

**To fix the "API configuration error" immediately:**

```bash
# 1. Create config file
cp .env.example .env.local

# 2. Edit with your API keys
nano .env.local  # or use your preferred editor

# 3. Add at minimum (for Patent Expert):
PERPLEXITY_API_KEY=pplx-your-actual-key-here
AGENT_ACCESS_PASSWORD=demo2024

# 4. Restart server
npm run dev
```

**That's it!** Your Patent Expert Agent should now work in Live Mode.

---

**Last Updated:** November 21, 2025
**Version:** 1.0
**Status:** ✅ Diagnostic complete | 🔧 Solution provided
