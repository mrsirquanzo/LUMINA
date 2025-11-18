# How to Change Vercel Deployment Branch

## Current Issue
Vercel is deploying: `claude/resume-previous-work-011CV4dMkKfLC5HCypKme9YW` (OLD)
Should be deploying: `claude/multi-model-integration-019fch7UpNnz8Nro1UmYcTeB` (CURRENT)

---

## Fix in Vercel Dashboard

### Step 1: Go to Project Settings
1. Open your Vercel dashboard: https://vercel.com
2. Click on your portfolio project
3. Click **"Settings"** tab at the top

### Step 2: Update Production Branch
1. In the Settings sidebar, click **"Git"**
2. Look for **"Production Branch"** section
3. You'll see it's currently set to: `claude/resume-previous-work-011CV4dMkKfLC5HCypKme9YW`
4. Click **"Edit"** or the input field
5. Change it to: `claude/multi-model-integration-019fch7UpNnz8Nro1UmYcTeB`
6. Click **"Save"**

### Step 3: Trigger New Deployment
After changing the branch:

**Option A: Automatic (Recommended)**
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** button on the latest deployment
3. Make sure it shows the new branch name

**Option B: Push a commit**
```bash
# Make a small change to trigger deployment
git commit --allow-empty -m "Trigger Vercel deployment on correct branch"
git push origin claude/multi-model-integration-019fch7UpNnz8Nro1UmYcTeB
```

---

## Verify Deployment

### 1. Check Branch in Deployment
Once deployment starts, verify:
- Go to **Deployments** tab
- Look at the new deployment
- Under the deployment name, you should see: `claude/multi-model-integration-019fch7UpNnz8Nro1UmYcTeB`

### 2. Check Environment Variables
After deployment completes:
1. Visit your live site
2. Navigate to any agent demo page
3. Try uploading a file and chatting
4. Should work without "API configuration error"

### 3. Verify Multi-Model Architecture
Check that agent cards show correct models:
- Clinical Data Analyst → Claude Sonnet 4 ✓
- Patent Expert → Claude Sonnet 4 ✓
- Regulatory Expert → Claude Sonnet 4 ✓
- Financial Analyst → Gemini 2.0 Flash ✓
- Market Research → Perplexity Sonar Pro ✓

---

## What's Different on the New Branch

The correct branch (`claude/multi-model-integration-019fch7UpNnz8Nro1UmYcTeB`) includes:

✅ **Updated Agent Cards**
- All 5 agents show specific model names (Gemini Pro, Perplexity Sonar Large, etc.)

✅ **Fixed API Routes**
- Proper API key validation for all agents
- Better error handling
- Consistent response format

✅ **Multi-Model LLM System**
- Gemini client for Financial Analyst
- Perplexity client for Patent & Market Research
- Claude Sonnet 4 for Clinical & Regulatory

✅ **Complete Documentation**
- API_SETUP.md - How to get API keys
- DEPLOYMENT_CHECKLIST.md - Vercel setup guide
- Updated .env.example with all 3 API keys

---

## Alternative: Use Vercel CLI

If you prefer command line:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Link to your project
vercel link

# Set production branch
vercel git connect
# Follow prompts to select the correct branch

# Deploy
vercel --prod
```

---

## Commit History Comparison

**Old Branch** (`claude/resume-previous-work-011CV4dMkKfLC5HCypKme9YW`):
- Missing multi-model integration
- Missing API fixes
- Missing updated agent cards

**Correct Branch** (`claude/multi-model-integration-019fch7UpNnz8Nro1UmYcTeB`):
```
5784fd1 - Add deployment checklist for Vercel environment setup
fe79e85 - Fix API configuration errors and add multi-model setup documentation
83ff79a - Add specific model names to agent cards for clarity
1024848 - Update agent cards to display correct multi-model AI architecture
5d06f1b - Add dependencies for multi-model LLM system
```

---

## Troubleshooting

**"Branch not found in Vercel"**
- Make sure you pushed the branch: `git push origin claude/multi-model-integration-019fch7UpNnz8Nro1UmYcTeB`
- Check it exists in GitHub/GitLab
- Refresh the Vercel dashboard

**"Deployment still using old branch"**
- Clear Vercel cache: Settings → Advanced → Clear Cache
- Try a fresh deployment: Deployments → Redeploy (uncheck "Use existing build cache")

**"Environment variables missing after branch change"**
- Environment variables persist across branches in Vercel
- No need to re-add them
- Just redeploy after changing the branch

---

## Need Help?

If you're still having trouble:
1. Take a screenshot of your Vercel Git settings
2. Check which branch shows in your latest deployment
3. Verify the branch exists in your Git repository
