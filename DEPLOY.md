# Deploy Guide

## Step 1 — Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit" && git push
```

## Step 2 — Connect to Vercel

vercel.com → Add New → Project → Import → Deploy

## Step 3 — Add Telnyx env vars in Vercel

Settings → Environment Variables, tick all environments (Production, Preview, Development):

- **TELNYX_API_KEY** — paste your Telnyx API key (from portal.telnyx.com → API Keys)
- **TELNYX_VERIFY_PROFILE_ID** — paste your Verify Profile UUID (from Verify → Verify Profiles)

## Step 4 — Redeploy

Deployments tab → three-dot menu on latest → Redeploy. Env vars only apply to new builds.

## Step 5 — Test

Open the deployed URL, run the quiz, enter a real AU mobile, click "Get My Finance Options" — SMS should arrive in ~5s.

> Never commit Telnyx values to git. GitHub push protection will block it anyway.
