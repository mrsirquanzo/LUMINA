# Deployment Checklist - Multi-Model AI Agents

## ✅ Vercel Environment Variables Configured

You've added the following environment variables to Vercel:

- ✅ `ANTHROPIC_API_KEY` - For Clinical Data Analyst & Regulatory Expert
- ✅ `GOOGLE_API_KEY` - For Financial Analyst
- ✅ `PERPLEXITY_API_KEY` - For Patent Expert & Market Research
- ✅ `AGENT_ACCESS_PASSWORD` - Custom secure password (not default)

---

## Next Steps

### 1. **Redeploy Your Application**

After adding environment variables in Vercel, you need to trigger a new deployment:

**Option A: Push a new commit**
```bash
git push origin claude/multi-model-integration-019fch7UpNnz8Nro1UmYcTeB
```

**Option B: Redeploy from Vercel Dashboard**
1. Go to your project in Vercel
2. Navigate to "Deployments" tab
3. Click the three dots (...) on the latest deployment
4. Select "Redeploy"
5. Check "Use existing Build Cache" (optional for faster deployment)

### 2. **Verify Environment Variables in Vercel**

Make sure all variables are correctly set:

1. Go to your Vercel project
2. Click "Settings" → "Environment Variables"
3. Confirm all four variables are listed:
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_API_KEY`
   - `PERPLEXITY_API_KEY`
   - `AGENT_ACCESS_PASSWORD`
4. Ensure they're enabled for the correct environments (Production, Preview, Development)

### 3. **Test Each Agent After Deployment**

Once redeployed, test each agent on your live site:

- [ ] **Clinical Data Analyst** - Upload a PDF, ask a question
- [ ] **Financial Analyst** - Upload a financial document
- [ ] **Patent Expert** - Search for patent information
- [ ] **Market Research** - Ask about market sizing
- [ ] **Regulatory Expert** - Ask about regulatory pathways

---

## Local Development Setup

For local development, create `.env.local`:

```bash
cp .env.example .env.local
```

Then add your API keys to `.env.local`:

```bash
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here
AGENT_ACCESS_PASSWORD=your_password_here
```

**Important:** `.env.local` is gitignored and won't be committed.

---

## Troubleshooting

### If agents still show "API configuration error":

1. **Check Vercel Environment Variables**
   - Ensure no extra spaces in the keys
   - Verify keys don't have quotes around them
   - Confirm variables are enabled for Production environment

2. **Verify Deployment Picked Up Changes**
   - Check deployment logs in Vercel
   - Look for "Environment variables injected" message
   - Redeploy if needed

3. **Test API Keys Individually**
   - Visit `/api/agents/financial-analyst` (GET request)
   - Should return: `{"name": "Financial Analyst Agent API", "status": "active", ...}`

4. **Check Browser Console**
   - Open DevTools → Console
   - Look for any API errors
   - Check Network tab for failed requests

### Common Issues:

**"Invalid API key"**
- The API key is incorrect or expired
- Generate a new key from the provider's console

**"Rate limit exceeded"**
- You've hit the API usage limit
- Check your usage in the provider's dashboard
- Consider upgrading to a paid tier

**"Authentication required"**
- You haven't logged in with the agent password
- Enter your custom password when prompted

---

## Multi-Model Architecture Verification

After deployment, verify each agent is using the correct model:

1. **Open DevTools → Network tab**
2. **Interact with each agent**
3. **Check the API response** for:
   - `"model"` field shows correct model name
   - `"provider"` field shows correct provider

**Expected values:**

| Agent | Model | Provider |
|-------|-------|----------|
| Clinical Data Analyst | claude-sonnet-4-20250514 | anthropic |
| Regulatory Expert | claude-sonnet-4-20250514 | anthropic |
| Patent Expert | sonar-pro | perplexity |
| Market Research | sonar-pro | perplexity |
| Financial Analyst | gemini-2.0-flash-exp | google |

---

## Cost Monitoring

Set up usage limits in each provider's console:

- **Anthropic Console**: https://console.anthropic.com/settings/limits
- **Google AI Studio**: https://aistudio.google.com/app/billing
- **Perplexity**: https://www.perplexity.ai/settings/api

**Recommended limits for portfolio demo:**
- Start with $10/month per provider
- Monitor usage in first week
- Adjust based on actual traffic

---

## Production Best Practices

✅ **Completed:**
- Environment variables in Vercel
- Custom secure password (not default)
- API key validation in all routes
- Error handling for missing keys

🔄 **Recommended:**
- [ ] Set up monitoring for API usage
- [ ] Configure rate limiting per user
- [ ] Add analytics to track agent usage
- [ ] Set up alerts for API errors

---

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Review API_SETUP.md for detailed setup guide
3. Test locally with `.env.local` first
4. Contact API providers for key issues
