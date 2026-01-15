# Vercel Deployment Checklist

Quick checklist for fresh LUMINA deployment on Vercel.

## Pre-Deployment
- [ ] Delete old Vercel project (if exists)
- [ ] Have GitHub access to `mrsirquanzo/LUMINA` repository
- [ ] Have Vercel account ready
- [ ] Have API keys ready (Anthropic, Google, Perplexity)

## Step 1: Create Project
- [ ] Click "New Project" in Vercel
- [ ] Import `mrsirquanzo/LUMINA` repository
- [ ] Verify framework: Next.js (auto-detected)
- [ ] Verify branch: `main`
- [ ] Click "Deploy" (will fail without API keys - that's OK)

## Step 2: Configure Settings
- [ ] Go to Settings → General
- [ ] Verify Production Branch: `main`
- [ ] Verify Build Command: `npm run build`
- [ ] Verify Output Directory: `.next`
- [ ] Set Node.js Version: `20.x`

## Step 3: Add Environment Variables
Go to Settings → Environment Variables, add:

- [ ] `ANTHROPIC_API_KEY` (Production, Preview)
- [ ] `GOOGLE_API_KEY` (Production, Preview)
- [ ] `PERPLEXITY_API_KEY` (Production, Preview)
- [ ] `AGENT_ACCESS_PASSWORD` (All environments) - Optional
- [ ] `NEXT_PUBLIC_LUMINA_DEPLOYMENT=true` (All environments)

## Step 4: Redeploy
- [ ] Go to Deployments tab
- [ ] Click "..." on latest deployment → "Redeploy"
- [ ] Uncheck "Use existing Build Cache"
- [ ] Click "Redeploy"
- [ ] Wait for build to complete (2-4 minutes)

## Step 5: Verify
- [ ] Deployment shows "Ready" ✅
- [ ] Visit root URL → Should redirect to `/lumina`
- [ ] Visit `/lumina` → Dashboard loads correctly
- [ ] Check commit SHA: Should be `a52dd8f` or newer
- [ ] Test navigation links work

## Step 6: Test (Optional)
- [ ] Test AI agents at `/ai-projects/multi-agent-demo`
- [ ] Verify agents respond (not showing errors)
- [ ] Check all dashboard features work

## ✅ Done!
Your LUMINA dashboard is deployed and working!
