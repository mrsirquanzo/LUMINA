# Multi-Model AI Agent API Setup

This portfolio uses a **multi-model LLM architecture** where different AI agents are powered by specialized models optimized for their specific tasks.

## Required API Keys

You need **three API keys** to use all agents:

### 1. **Anthropic API Key** (Claude Sonnet 4)
**Used by:**
- Clinical Data Analyst
- Regulatory Expert

**Why:** Claude Sonnet 4 provides superior reasoning for complex clinical trial analysis and regulatory pathway assessment.

**Get your key:**
1. Visit https://console.anthropic.com/settings/keys
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)

### 2. **Google Gemini API Key**
**Used by:**
- Financial Analyst

**Why:** Gemini 2.0 Flash offers large context windows ideal for analyzing lengthy financial documents and SEC filings, with fast processing and cost-effective pricing for high-volume analysis.

**Get your key:**
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### 3. **Perplexity API Key**
**Used by:**
- Patent Expert
- Market Research Agent

**Why:** Perplexity Sonar Pro provides real-time web search capabilities with deep retrieval, essential for accessing live patent databases and current market intelligence.

**Get your key:**
1. Visit https://www.perplexity.ai/settings/api
2. Sign up or log in
3. Navigate to API settings
4. Generate an API key
5. Copy the key

---

## Setup Instructions

### Step 1: Copy Environment File
```bash
cp .env.example .env.local
```

### Step 2: Add Your API Keys
Open `.env.local` and replace the placeholder values:

```bash
# Replace these with your actual API keys
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
GOOGLE_API_KEY=AIzaSy-your-actual-key-here
PERPLEXITY_API_KEY=pplx-your-actual-key-here

# Set your agent access password
AGENT_ACCESS_PASSWORD=your-secure-password-here
```

### Step 3: Restart Development Server
```bash
npm run dev
```

---

## Testing Your Setup

Once configured, you can test each agent:

1. **Clinical Data Analyst** (`/ai-projects/data-analyst-demo`)
   - Requires: `ANTHROPIC_API_KEY`

2. **Financial Analyst** (`/ai-projects/financial-analyst-demo`)
   - Requires: `GOOGLE_API_KEY`

3. **Patent Expert** (`/ai-projects/patent-expert-demo`)
   - Requires: `PERPLEXITY_API_KEY`

4. **Market Research** (`/ai-projects/market-research-demo`)
   - Requires: `PERPLEXITY_API_KEY`

5. **Regulatory Expert** (`/ai-projects/regulatory-demo`)
   - Requires: `ANTHROPIC_API_KEY`

---

## Cost Considerations

Each API has different pricing:

- **Anthropic (Claude Sonnet 4):** $3/M input tokens, $15/M output tokens
- **Google (Gemini 2.0 Flash):** Free tier available, then $0.075/M input tokens, $0.30/M output tokens
- **Perplexity (Sonar Pro):** $3/M tokens with online search included

For development and demo purposes, the free tiers should be sufficient. Set usage limits in each platform's console to control costs.

---

## Troubleshooting

### "API configuration error"
- Check that the API key is correctly set in `.env.local`
- Ensure there are no extra spaces or quotes around the key
- Verify the key is valid by testing it in the provider's console

### "Invalid API key"
- The key may have been revoked or expired
- Generate a new key from the provider's console
- Double-check you're using the correct key for the right agent

### "Rate limit exceeded"
- You've hit the free tier limit
- Wait a few minutes and try again
- Consider upgrading to a paid tier for higher limits

---

## Security Best Practices

1. **Never commit `.env.local` to git** (it's already in `.gitignore`)
2. **Rotate API keys regularly**
3. **Set usage limits** in each provider's console
4. **Use environment variables** in production (not `.env.local`)
5. **Monitor usage** through each provider's dashboard

---

## Multi-Model Architecture Benefits

This portfolio demonstrates a **multi-model approach** where each agent uses the best model for its specific task:

| Agent | Model | Key Strength |
|-------|-------|--------------|
| Clinical Data Analyst | Claude Sonnet 4 | Complex reasoning |
| Patent Expert | Claude Sonnet 4 | IP analysis & reasoning |
| Regulatory Expert | Claude Sonnet 4 | Regulatory knowledge |
| Financial Analyst | Gemini 2.0 Flash | Large context + fast + cost-effective |
| Market Research | Perplexity Sonar Pro | Live market data |

This architecture optimizes for **performance**, **cost**, and **specialized capabilities** rather than using a single model for everything.

---

## Need Help?

- Check the [Next.js Environment Variables docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- Review provider documentation:
  - [Anthropic API Docs](https://docs.anthropic.com/)
  - [Google Gemini API Docs](https://ai.google.dev/docs)
  - [Perplexity API Docs](https://docs.perplexity.ai/)
