# LUMINA Dashboard Deployment Setup

## ✅ Automatic Redirect Configured

When deploying from the **LUMINA repository**, the root path (`/`) will automatically redirect to `/lumina` dashboard.

## How It Works

The `middleware.ts` file detects LUMINA deployments by checking:
1. **VERCEL_GIT_REPO_SLUG** environment variable (set by Vercel)
2. **Hostname** containing "lumina"
3. **GIT_REPO_SLUG** environment variable (fallback)

## Manual Configuration (If Needed)

If the automatic detection doesn't work, you can set an environment variable in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_LUMINA_DEPLOYMENT` = `true`
3. Redeploy

## Accessing the Dashboard

After deployment:
- **Root URL:** `https://your-app.vercel.app/` → Automatically redirects to `/lumina`
- **Direct URL:** `https://your-app.vercel.app/lumina`
- **Navigation:** Click "LUMINA" in the header menu

## Verification

To verify the middleware is working:
1. Check Vercel build logs for middleware compilation
2. Visit root URL - should redirect to `/lumina`
3. Check browser network tab - should see 307 redirect

## Troubleshooting

If redirect doesn't work:
1. Check Vercel environment variables (VERCEL_GIT_REPO_SLUG)
2. Verify middleware.ts is in the repository
3. Check Vercel build logs for middleware errors
4. Manually set `NEXT_PUBLIC_LUMINA_DEPLOYMENT=true` in Vercel
