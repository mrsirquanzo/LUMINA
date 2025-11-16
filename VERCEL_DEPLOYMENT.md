# Deploying Sonny to Vercel with MCP Enabled

## Complete Deployment Guide

This guide walks you through deploying your Sonny multi-agent system to Vercel with Model Context Protocol (MCP) enabled for real-time data access.

---

## 📋 Prerequisites

Before deploying, you'll need:

1. **Vercel Account** - Sign up at https://vercel.com (free tier is fine)
2. **GitHub Repository** - Your code must be pushed to GitHub
3. **API Keys** - Get your free API keys (instructions below)

---

## 🔑 Step 1: Get Your Free API Keys (10 minutes)

### Required API Keys (For Multi-Model LLMs):

1. **Anthropic API Key** (Claude Sonnet 4)
   - Visit: https://console.anthropic.com/settings/keys
   - Click "Create Key"
   - Copy the key (starts with `sk-ant-`)
   - **Cost**: Pay-as-you-go (Claude Sonnet 4: $3/M input, $15/M output tokens)

2. **Google Gemini API Key** (Gemini 2.0 Flash)
   - Visit: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key
   - **Cost**: Free tier available

3. **Perplexity API Key** (Sonar Pro)
   - Visit: https://www.perplexity.ai/settings/api
   - Create account and get API key
   - Copy the key (starts with `pplx-`)
   - **Cost**: Pay-as-you-go

### Optional API Keys (For MCP - Real-Time Data):

4. **PubMed API Key** (Recommended - Free)
   - Visit: https://www.ncbi.nlm.nih.gov/account/register/
   - Create account (2 minutes)
   - Go to: https://www.ncbi.nlm.nih.gov/account/settings/
   - Click "Create an API Key"
   - Copy the key
   - **Benefit**: Increases rate limit from 3 to 10 requests/second
   - **Cost**: FREE

5. **Alpha Vantage API Key** (Recommended - Free)
   - Visit: https://www.alphavantage.co/support/#api-key
   - Enter email, click "GET FREE API KEY"
   - Copy the key (instantly delivered)
   - **Benefit**: Real-time stock data and financial analytics
   - **Cost**: FREE (25 requests/day, 5 requests/minute)

---

## 🚀 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click "Add New" → "Project"

2. **Import Repository**
   - Click "Import Git Repository"
   - Select your repository: `mrsirquanzo/Quan_project`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `next build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - Click "Deploy"

4. **Wait for Initial Deployment**
   - First deployment will fail (expected - we need to add environment variables)
   - Don't worry! We'll fix this in the next step

### Option B: Deploy via Vercel CLI (Advanced)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd /path/to/Quan_project
vercel

# Follow the prompts
```

---

## 🔧 Step 3: Add Environment Variables

### In Vercel Dashboard:

1. **Navigate to Your Project**
   - Go to: https://vercel.com/dashboard
   - Click on your project name

2. **Open Settings**
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

3. **Add Required Variables (Multi-Model LLMs)**

   **ANTHROPIC_API_KEY**
   ```
   Value: sk-ant-your-actual-key-here
   Environments: Production, Preview, Development (check all)
   ```

   **GOOGLE_API_KEY**
   ```
   Value: your-google-api-key-here
   Environments: Production, Preview, Development (check all)
   ```

   **PERPLEXITY_API_KEY**
   ```
   Value: pplx-your-actual-key-here
   Environments: Production, Preview, Development (check all)
   ```

4. **Add MCP Environment Variables**

   **MCP_ENABLED**
   ```
   Value: true
   Environments: Production, Preview, Development (check all)
   ```

   **PUBMED_API_KEY** (Optional but recommended)
   ```
   Value: 283df01a5271e87e0369ea9b93c1aed9fe09
   Environments: Production, Preview, Development (check all)
   ```

   **FINANCIAL_API_KEY** (Optional - Alpha Vantage)
   ```
   Value: your-alpha-vantage-api-key-here
   Environments: Production, Preview, Development (check all)
   ```

5. **Optional: Set Agent Access Password**

   **AGENT_ACCESS_PASSWORD**
   ```
   Value: your-secure-password-here
   Environments: Production, Preview, Development (check all)
   ```

   Default is `demo2024` - change this for security!

### Using Vercel CLI (Alternative):

```bash
# Add environment variables via CLI
vercel env add ANTHROPIC_API_KEY production
# Paste your key when prompted

vercel env add GOOGLE_API_KEY production
# Paste your key when prompted

vercel env add PERPLEXITY_API_KEY production
# Paste your key when prompted

vercel env add MCP_ENABLED production
# Enter: true

vercel env add PUBMED_API_KEY production
# Paste your key when prompted

vercel env add FINANCIAL_API_KEY production
# Paste your key when prompted

# Repeat for preview and development environments if needed
```

---

## ✅ Step 4: Redeploy with Environment Variables

### Via Dashboard:

1. **Go to Deployments Tab**
   - Click "Deployments" in your project
   - Find the latest deployment
   - Click "..." menu → "Redeploy"
   - Click "Redeploy" to confirm

### Via CLI:

```bash
vercel --prod
```

### Via Git Push:

```bash
# Make any small change (or empty commit)
git commit --allow-empty -m "Trigger Vercel deployment with env vars"
git push origin claude/multi-model-integration-019fch7UpNnz8Nro1UmYcTeB
```

Vercel will auto-deploy on push!

---

## 🧪 Step 5: Test Your Deployment

### 1. Visit Your Live Site

Your site will be at: `https://your-project-name.vercel.app`

Or find it in Vercel Dashboard → Deployments → "Visit"

### 2. Test Multi-Agent System

1. Navigate to: `/ai-projects/multi-agent-demo`
2. Try a sample query: "What are Moderna's recent melanoma clinical trials?"
3. Watch the agents work!

### 3. Verify MCP Is Working

With MCP enabled, agents should:
- Reference live ClinicalTrials.gov data
- Cite actual PubMed publications
- Show real SEC filings (if queried)
- Display current stock data (if Alpha Vantage key added)

**Without MCP**: Agents say "Based on my training knowledge..."
**With MCP**: Agents say "According to ClinicalTrials.gov..." with NCT IDs and URLs

---

## 📊 Step 6: Monitor Your Deployment

### Check Build Logs

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments"
3. Click on latest deployment
4. Check "Build Logs" for any errors

### Check Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Monitor real-time function execution
4. Look for MCP API calls

### Monitor API Usage

- **Anthropic**: https://console.anthropic.com/settings/usage
- **Google**: https://console.cloud.google.com/apis/dashboard
- **Perplexity**: https://www.perplexity.ai/settings/api
- **Alpha Vantage**: No dashboard, but you'll get errors at 25 requests/day

---

## 🔧 Troubleshooting

### Build Fails

**Error**: "Module not found"
- **Fix**: Make sure all dependencies are in `package.json`
- Run: `npm install` locally and commit `package-lock.json`

**Error**: "Environment variable not defined"
- **Fix**: Check all required env vars are set in Vercel dashboard
- Required: `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `PERPLEXITY_API_KEY`

### MCP Not Working

**Symptom**: Agents don't cite live data

**Fix**:
1. Check `MCP_ENABLED=true` in environment variables
2. Redeploy after adding env var
3. Check function logs for MCP errors

### API Rate Limits

**Alpha Vantage**: 25 requests/day, 5/minute
- **Fix**: Wait 24 hours or upgrade to premium tier

**PubMed**: 3 req/sec (10 with API key)
- **Fix**: Add `PUBMED_API_KEY` environment variable

**SEC EDGAR**: 10 req/second
- **Fix**: Add delays between requests

### 529 Errors (Anthropic)

**Error**: "Overloaded"
- **Fix**: Temporary server issue, retry after 30-60 seconds

---

## 🎯 Post-Deployment Checklist

- [ ] Site loads at Vercel URL
- [ ] Multi-agent demo page works
- [ ] All 5 agents respond (Clinical, Patent, Financial, Market, Regulatory)
- [ ] MCP enabled (agents cite live data sources)
- [ ] Individual agent demos work
- [ ] Authentication works (if enabled)
- [ ] No console errors in browser
- [ ] Function logs show successful API calls

---

## 🔒 Security Best Practices

1. **Rotate API Keys Regularly**
   - Update in Vercel Dashboard → Settings → Environment Variables

2. **Change Default Password**
   - Set strong `AGENT_ACCESS_PASSWORD`

3. **Monitor Usage**
   - Check API dashboards weekly
   - Set up billing alerts

4. **Never Commit .env.local**
   - Already in `.gitignore`
   - Never commit API keys to Git

---

## 💡 Production Tips

### Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `quanho.dev`)
3. Update DNS records as instructed
4. SSL certificate auto-generated

### Branch Deployment

Vercel auto-deploys:
- **Production**: Deployments from main branch → `your-project.vercel.app`
- **Preview**: Deployments from other branches → `your-project-git-branch.vercel.app`

Your current branch: `claude/multi-model-integration-019fch7UpNnz8Nro1UmYcTeB`
- Preview URL: `quan-project-git-claude-multi-model-[hash].vercel.app`

### Performance Optimization

- **Enable Edge Network**: Vercel does this automatically
- **Caching**: MCP responses could be cached (future enhancement)
- **Rate Limiting**: Implement for high-traffic sites

---

## 📈 Scaling

### Free Tier Limits (Hobby Plan)

- **Bandwidth**: 100 GB/month
- **Serverless Functions**: 100 GB-hours/month
- **Build Minutes**: 6000 minutes/month
- **API Calls**: No Vercel limits, but API providers have limits

### If You Need More

Upgrade to Pro: $20/month
- Unlimited bandwidth
- Faster builds
- Team collaboration
- Analytics dashboard

---

## 🚀 Your Deployment URLs

After deployment, you'll have:

**Production URL**: `https://quan-project.vercel.app` (or your custom domain)

**Key Pages**:
- Home: `/`
- Sonny Demo: `/ai-projects/multi-agent-demo`
- Clinical Agent: `/ai-projects/data-analyst-demo`
- Financial Agent: `/ai-projects/financial-analyst-demo`
- Patent Agent: `/ai-projects/patent-expert-demo`
- Market Research: `/ai-projects/market-research-demo`
- Regulatory Agent: `/ai-projects/regulatory-expert-demo`

---

## ✅ Success!

Your Sonny multi-agent system is now live with:
- ✅ 5 specialized AI agents orchestrated by Sonny
- ✅ 3 different AI models (Claude, Gemini, Perplexity)
- ✅ MCP real-time data access
- ✅ 400,000+ clinical trials (ClinicalTrials.gov)
- ✅ 35+ million publications (PubMed)
- ✅ All US SEC filings (SEC EDGAR)
- ✅ FDA drug approvals (openFDA)
- ✅ Real-time stock data (Alpha Vantage)
- ✅ Production-ready deployment

**Next Steps**: Share your live demo URL and start showcasing your AI-powered biotech due diligence platform! 🎉

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Check function logs in Vercel Dashboard
