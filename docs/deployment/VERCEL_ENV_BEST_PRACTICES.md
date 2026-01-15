# Vercel Environment Variables - Best Practices

## Recommended Configuration

For your multi-model AI portfolio, here's the recommended setup:

### ✅ **Production** - Enable ALL API keys
```
✓ ANTHROPIC_API_KEY
✓ GOOGLE_API_KEY
✓ PERPLEXITY_API_KEY
✓ AGENT_ACCESS_PASSWORD
```

**Why:** Your live site needs all API keys to work.

---

### ⚠️ **Preview** - OPTIONAL (Recommended: Disable for cost control)
```
⊗ ANTHROPIC_API_KEY (Disable)
⊗ GOOGLE_API_KEY (Disable)
⊗ PERPLEXITY_API_KEY (Disable)
✓ AGENT_ACCESS_PASSWORD (Keep enabled - no cost)
```

**Why Preview deployments:**
- Created for every PR and branch push
- Could rack up API costs if people test agents
- Usually not needed for UI/frontend testing
- Agents will show "API configuration error" but won't charge you

**When to enable Preview:**
- If you need to test API integrations before merging
- For demo purposes to show stakeholders
- When testing new agent features

---

### ❌ **Development** - DISABLE (Use .env.local instead)
```
⊗ All API keys (Disable)
```

**Why:**
- Local development should use `.env.local`
- Keeps your local keys separate from Vercel
- More secure
- Easier to manage different keys for testing

---

## Current Setup Analysis

You mentioned API keys are set to **"All environments"**. Here's what that means:

| Environment | Has API Keys? | Cost Impact | Recommendation |
|-------------|---------------|-------------|----------------|
| **Production** | ✅ Yes | Expected | ✅ Keep enabled |
| **Preview** | ⚠️ Yes | Could be high | ⚠️ Consider disabling |
| **Development** | ⚠️ Yes | Local dev doesn't use Vercel vars | ❌ Disable |

---

## Recommended Changes

### Option 1: Secure & Cost-Effective (Recommended)
**Best for:** Production portfolio, cost control, security

**Production Environment:**
```
✓ ANTHROPIC_API_KEY
✓ GOOGLE_API_KEY
✓ PERPLEXITY_API_KEY
✓ AGENT_ACCESS_PASSWORD
```

**Preview Environment:**
```
⊗ ANTHROPIC_API_KEY (Disabled)
⊗ GOOGLE_API_KEY (Disabled)
⊗ PERPLEXITY_API_KEY (Disabled)
✓ AGENT_ACCESS_PASSWORD (Enabled - for demo login)
```

**Development Environment:**
```
⊗ All disabled (use .env.local locally)
```

**Pros:**
- ✅ Production works fully
- ✅ Preview builds succeed (agents just show API errors)
- ✅ No unexpected API costs from preview deployments
- ✅ More secure

**Cons:**
- ⚠️ Can't test live agents in preview deployments

---

### Option 2: Full Testing (Higher Cost)
**Best for:** Active development, need to test agents in preview

**All Environments:**
```
✓ All API keys enabled everywhere
```

**Pros:**
- ✅ Can test agents in preview deployments
- ✅ Full functionality everywhere

**Cons:**
- ❌ Higher API costs (preview deployments can be tested by anyone)
- ❌ Less secure (more places where keys are available)
- ❌ Could hit rate limits faster

---

## How to Change Settings in Vercel

### Step 1: Go to Environment Variables
1. Open Vercel dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Edit Each Variable
For each API key (ANTHROPIC_API_KEY, GOOGLE_API_KEY, PERPLEXITY_API_KEY):

1. Click the **three dots (...)** next to the variable
2. Click **"Edit"**
3. You'll see checkboxes for:
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development

4. **Recommended settings:**
   - ✅ **Check** Production
   - ⬜ **Uncheck** Preview (to save costs)
   - ⬜ **Uncheck** Development

5. Click **"Save"**

### Step 3: Redeploy
After changing environment variable settings:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest production deployment
3. Preview deployments will automatically use new settings on next PR/push

---

## Cost Monitoring

### Current Risk with "All Environments" Enabled:

**Scenario:** Someone finds your preview deployment URL and tests all 5 agents repeatedly

**Cost breakdown:**
- Anthropic (Claude Sonnet 4): $3/M input + $15/M output
- Google (Gemini Pro): Free tier, then $0.50/M input
- Perplexity (Sonar Large): $1/M tokens

**Example:**
- 100 test queries across 5 agents
- ~500,000 tokens total
- Could cost: $5-15 in API charges

**With Preview disabled:** $0 (agents don't work in preview)

---

## Recommended Security Settings

### API Key Protection:
1. ✅ Set usage limits in each provider's console:
   - Anthropic: https://console.anthropic.com/settings/limits
   - Google AI: https://aistudio.google.com/app/billing
   - Perplexity: https://www.perplexity.ai/settings/api

2. ✅ Set monthly budget alerts (e.g., $20/month)

3. ✅ Keep `AGENT_ACCESS_PASSWORD` strong and unique

4. ✅ Rotate API keys periodically (every 90 days)

---

## My Recommendation

For your portfolio site, I recommend:

**Environment Variable Settings:**
```
Production:  ✅ All API keys enabled
Preview:     ❌ API keys disabled (password enabled)
Development: ❌ All disabled (use .env.local)
```

**Why:**
1. **Saves money** - Preview deployments won't burn API credits
2. **Security** - Fewer places where keys are active
3. **Production works** - Your live site has full functionality
4. **Testing still works** - UI/frontend changes can be previewed, just not live agent functionality

**When you need to test agents in preview:**
- Temporarily enable API keys for Preview environment
- Test your changes
- Disable Preview API keys again

---

## Quick Action Steps

To implement the recommended setup:

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **For each API key** (ANTHROPIC_API_KEY, GOOGLE_API_KEY, PERPLEXITY_API_KEY):
   - Click **Edit**
   - ✅ Check **Production** only
   - ⬜ Uncheck **Preview**
   - ⬜ Uncheck **Development**
   - Click **Save**

3. **For AGENT_ACCESS_PASSWORD**:
   - ✅ Check **Production**
   - ✅ Check **Preview** (allows demo login testing)
   - ⬜ Uncheck **Development**
   - Click **Save**

4. **Redeploy** to apply changes

---

## Questions?

**Q: Will preview deployments break?**
A: No, they'll build successfully. Agents just won't work (will show API config error).

**Q: How do I test agent changes before production?**
A: Either:
- Test locally with `.env.local`
- Temporarily enable Preview environment variables
- Test in production (safe for a portfolio)

**Q: What about Development environment?**
A: Local development uses `.env.local`, not Vercel's Development variables.

**Q: Can I enable Preview for just one API key?**
A: Yes! Enable only what you need. For example, keep Anthropic enabled but disable Perplexity.
