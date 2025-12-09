# Fresh Vercel Deployment Guide - LUMINA Dashboard

Complete step-by-step guide to deploy LUMINA from scratch on Vercel.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ GitHub account with access to `mrsirquanzo/LUMINA` repository
- ✅ Vercel account (sign up at https://vercel.com if needed)
- ✅ API keys ready (see Step 5 for details)

---

## 🗑️ Step 1: Delete Current Vercel Project

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Log in to your account

2. **Find Your Project**
   - Look for the project named "lumina" (or whatever it's currently named)
   - Click on the project to open it

3. **Delete the Project**
   - Go to **Settings** tab (bottom of left sidebar)
   - Scroll down to **"Danger Zone"** section
   - Click **"Delete Project"**
   - Type the project name to confirm
   - Click **"Delete"**

   ⚠️ **Note:** This will delete all deployments, but your code in GitHub is safe!

---

## 🆕 Step 2: Create New Vercel Project

1. **Start New Project**
   - In Vercel Dashboard, click **"Add New..."** → **"Project"**
   - Or click the **"New Project"** button

2. **Import Git Repository**
   - You'll see a list of your GitHub repositories
   - **Search for or find:** `mrsirquanzo/LUMINA`
   - Click **"Import"** next to the LUMINA repository

3. **Configure Project**
   - **Project Name:** `lumina` (or keep default)
   - **Framework Preset:** Should auto-detect "Next.js" ✅
   - **Root Directory:** Leave as `./` (default)
   - **Build Command:** Should show `npm run build` ✅
   - **Output Directory:** Should show `.next` ✅
   - **Install Command:** Should show `npm install` ✅

4. **Environment Variables** (Skip for now - we'll add these in Step 5)
   - Click **"Skip"** or **"Deploy"** - we'll add env vars after first deployment

5. **Deploy**
   - Click **"Deploy"** button
   - Wait for the first deployment to complete (this will fail without API keys, but that's OK)

---

## ⚙️ Step 3: Configure Project Settings

After the first deployment completes (even if it failed):

1. **Go to Project Settings**
   - Click **"Settings"** tab in your project

2. **General Settings**
   - **Project Name:** `lumina`
   - **Framework:** Next.js (should be auto-detected)

3. **Git Settings** (Verify)
   - **Repository:** Should show `mrsirquanzo/LUMINA`
   - **Production Branch:** Should be `main` ✅
   - If not `main`, change it to `main`

4. **Build & Development Settings**
   - **Build Command:** `npm run build` ✅
   - **Output Directory:** `.next` ✅
   - **Install Command:** `npm install` ✅
   - **Development Command:** `npm run dev` ✅

5. **Node.js Version**
   - **Node.js Version:** Select `20.x` (or latest LTS)

---

## 🔑 Step 4: Add Environment Variables

**This is critical!** Without these, the AI agents won't work.

1. **Go to Environment Variables**
   - In Settings, click **"Environment Variables"** in the left sidebar

2. **Add Each Variable** (Click "Add New" for each):

   ### Required API Keys:

   **a) ANTHROPIC_API_KEY**
   ```
   Key: ANTHROPIC_API_KEY
   Value: [Your Anthropic API key - starts with sk-ant-]
   Environments: ✅ Production, ✅ Preview, ⬜ Development
   ```
   - Get key: https://console.anthropic.com/settings/keys
   - Used by: Clinical Data Analyst, Regulatory Expert, Target Biology Agent

   **b) GOOGLE_API_KEY**
   ```
   Key: GOOGLE_API_KEY
   Value: [Your Google Gemini API key - starts with AIzaSy]
   Environments: ✅ Production, ✅ Preview, ⬜ Development
   ```
   - Get key: https://aistudio.google.com/app/apikey
   - Used by: Financial Analyst

   **c) PERPLEXITY_API_KEY**
   ```
   Key: PERPLEXITY_API_KEY
   Value: [Your Perplexity API key - starts with pplx-]
   Environments: ✅ Production, ✅ Preview, ⬜ Development
   ```
   - Get key: https://www.perplexity.ai/settings/api
   - Used by: Patent Expert, Market Research Agent

   **d) AGENT_ACCESS_PASSWORD** (Optional but recommended)
   ```
   Key: AGENT_ACCESS_PASSWORD
   Value: [Your secure password]
   Environments: ✅ Production, ✅ Preview, ✅ Development
   ```
   - Default: `demo2024` (change for security!)

   **e) NEXT_PUBLIC_LUMINA_DEPLOYMENT** (For auto-redirect)
   ```
   Key: NEXT_PUBLIC_LUMINA_DEPLOYMENT
   Value: true
   Environments: ✅ Production, ✅ Preview, ✅ Development
   ```
   - This ensures root URL redirects to `/lumina` dashboard

3. **Save Each Variable**
   - After entering each variable, click **"Save"**
   - Repeat for all variables

4. **Verify All Variables**
   - You should see all 5 variables listed
   - Check that Production is enabled for API keys

---

## 🚀 Step 5: Redeploy with Environment Variables

1. **Go to Deployments Tab**
   - Click **"Deployments"** in the top navigation

2. **Redeploy Latest**
   - Find the latest deployment (might have failed)
   - Click the **"..."** (three dots) menu
   - Click **"Redeploy"**
   - **Important:** Uncheck **"Use existing Build Cache"** (to force fresh build)
   - Click **"Redeploy"**

3. **Wait for Deployment**
   - Watch the build logs
   - Should complete successfully now with API keys
   - Build typically takes 2-4 minutes

---

## ✅ Step 6: Verify Deployment

After deployment completes:

1. **Check Deployment Status**
   - Should show **"Ready"** with green checkmark ✅
   - Deployment URL: `https://lumina-xxxxx.vercel.app`

2. **Test Root URL Redirect**
   - Visit: `https://your-deployment-url.vercel.app/`
   - Should automatically redirect to `/lumina` ✅
   - If not, manually visit: `https://your-deployment-url.vercel.app/lumina`

3. **Verify Dashboard**
   - Should see "LUMINA Dashboard" with "Asset Intelligence" page
   - Sidebar with "SMART VIEWS" and "FILTERS"
   - Company cards visible (Bicycle Therapeutics, Immunocore, etc.)

4. **Test Navigation**
   - Click "LUMINA" in the header (if visible)
   - Should navigate to `/lumina` dashboard

5. **Check Commit**
   - In Vercel Dashboard → Deployments → Latest
   - **Commit SHA** should be: `a52dd8f` or newer
   - **Commit Message:** "Trigger Vercel deployment with latest changes"

---

## 🧪 Step 7: Test AI Agents (Optional)

To verify agents work:

1. **Navigate to Agent Pages**
   - `/ai-projects/multi-agent-demo` - Multi-agent system
   - `/ai-projects/data-analyst-demo` - Clinical Data Analyst
   - `/ai-projects/financial-analyst-demo` - Financial Analyst
   - `/ai-projects/target-biology-demo` - Target Biology Agent

2. **Test Each Agent**
   - Switch to "Live Mode"
   - Enter password (if AGENT_ACCESS_PASSWORD is set)
   - Try a sample query
   - Should get AI responses (not errors)

---

## 🔧 Troubleshooting

### Issue: Build Fails
- **Check:** Build logs in Vercel Dashboard
- **Common causes:** Missing dependencies, TypeScript errors
- **Fix:** Check error message in build logs

### Issue: Dashboard Not Showing
- **Check:** Visit `/lumina` directly (not just root)
- **Check:** Environment variable `NEXT_PUBLIC_LUMINA_DEPLOYMENT=true` is set
- **Check:** Middleware is working (check browser network tab for redirect)

### Issue: Old Version Still Deploying
- **Check:** Git repository connection in Vercel Settings
- **Check:** Production branch is `main`
- **Fix:** Disconnect and reconnect Git repository

### Issue: API Agents Not Working
- **Check:** All environment variables are set correctly
- **Check:** API keys are valid and have credits
- **Check:** Environment variables enabled for "Production"
- **Fix:** Redeploy after adding/updating environment variables

### Issue: Root URL Shows Portfolio Instead of Dashboard
- **Check:** `NEXT_PUBLIC_LUMINA_DEPLOYMENT=true` is set
- **Check:** `middleware.ts` exists in repository
- **Fix:** Set environment variable and redeploy

---

## 📝 Quick Reference

### Repository
- **GitHub:** `https://github.com/mrsirquanzo/LUMINA.git`
- **Branch:** `main`
- **Latest Commit:** `a52dd8f`

### Key Files
- `middleware.ts` - Auto-redirect to `/lumina`
- `app/(lumina)/lumina/page.tsx` - Dashboard main page
- `components/lumina/*` - Dashboard components
- `app/api/agents/*` - AI agent API routes

### Environment Variables Checklist
- [ ] `ANTHROPIC_API_KEY`
- [ ] `GOOGLE_API_KEY`
- [ ] `PERPLEXITY_API_KEY`
- [ ] `AGENT_ACCESS_PASSWORD` (optional)
- [ ] `NEXT_PUBLIC_LUMINA_DEPLOYMENT=true`

### URLs to Test
- Root: `https://your-app.vercel.app/` → Should redirect to `/lumina`
- Dashboard: `https://your-app.vercel.app/lumina`
- Multi-Agent: `https://your-app.vercel.app/ai-projects/multi-agent-demo`

---

## 🎉 Success!

If everything works:
- ✅ Dashboard loads at `/lumina`
- ✅ Root URL redirects to dashboard
- ✅ All AI agents functional
- ✅ Latest commit deployed

Your LUMINA dashboard is now live! 🚀

---

## 📞 Need Help?

If you encounter issues:
1. Check Vercel build logs for specific errors
2. Verify all environment variables are set
3. Ensure Git repository is connected correctly
4. Check that you're deploying from the `main` branch
