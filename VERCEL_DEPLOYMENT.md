# Vercel Deployment Guide

## Quick Fix: Adding Environment Variables to Vercel

If you're seeing the error "Missing Supabase environment variables" after deploying to Vercel, follow these steps:

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and log in
2. Select your project (secret-santa)

### Step 2: Add Environment Variables
1. Click on **Settings** in the top navigation
2. Click on **Environment Variables** in the left sidebar
3. Add the following two variables:

#### Variable 1:
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://qudeafymripwfekgdsst.supabase.co`
- **Environment:** Check all three boxes:
  - ☑ Production
  - ☑ Preview  
  - ☑ Development
- Click **Save**

#### Variable 2:
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZGVhZnltcmlwd2Zla2dkc3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NjY0ODksImV4cCI6MjA3ODE0MjQ4OX0.R9qghlThoJ71lWZH1A0bYnqPSrsfbyxOgvmDvv7sRV0`
- **Environment:** Check all three boxes:
  - ☑ Production
  - ☑ Preview
  - ☑ Development
- Click **Save**

### Step 3: Redeploy
1. Go to the **Deployments** tab
2. Click the **⋯** (three dots) menu on your latest deployment
3. Click **Redeploy**
4. Or simply push a new commit to trigger a new deployment

### Step 4: Verify
After redeployment, your app should work correctly. The environment variables will be available to your Next.js application.

## Important Notes

- Environment variables added in Vercel are **only** available in the deployed environment
- Your local `.env.local` file is **not** deployed to Vercel (and shouldn't be - it's in `.gitignore`)
- You need to add environment variables separately for each environment (Production, Preview, Development) or select all when adding them
- After adding environment variables, you **must** redeploy for them to take effect

## Troubleshooting

### Still seeing the error after adding variables?
1. Make sure you clicked **Save** after adding each variable
2. Make sure you selected the correct environments (Production, Preview, Development)
3. **Redeploy** your application after adding the variables
4. Check that the variable names are exactly:
   - `NEXT_PUBLIC_SUPABASE_URL` (case-sensitive)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (case-sensitive)

### Variables not updating?
- Environment variables are only loaded at build time
- You must redeploy after adding or changing environment variables
- Clear your browser cache and try again

