# Setup Guide

This guide will help you set up and deploy the Secret Santa Spinning Wheel application.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Vercel account (for deployment)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is created, go to **Settings** → **API**
3. Copy your **Project URL** and **anon/public key**
4. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 3: Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste it into the SQL Editor and run it
4. This will create the necessary tables and policies

## Step 4: (Optional) Add Sound Effects

1. Create sound effect files:
   - `public/sounds/spin.mp3` - Sound for wheel spinning
   - `public/sounds/stop.mp3` - Sound for wheel stopping
2. If you don't add sound files, the app will use Web Audio API tones automatically

## Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Deploy to Vercel

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import your repository
3. **Add your environment variables in Vercel:**
   - After importing your project, go to **Settings** → **Environment Variables**
   - Click **Add New**
   - Add the following variables:
     - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
     - **Value:** `https://qudeafymripwfekgdsst.supabase.co`
     - **Environment:** Select all (Production, Preview, Development)
     - Click **Save**
   - Add the second variable:
     - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZGVhZnltcmlwd2Zla2dkc3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NjY0ODksImV4cCI6MjA3ODE0MjQ4OX0.R9qghlThoJ71lWZH1A0bYnqPSrsfbyxOgvmDvv7sRV0`
     - **Environment:** Select all (Production, Preview, Development)
     - Click **Save**
4. Go to **Deployments** tab and redeploy your application (or trigger a new deployment)
5. Your app should now work with Supabase!

## Features

- ✅ User form with name and employee ID
- ✅ Interactive spinning wheel with smooth animations
- ✅ Confetti celebration on result
- ✅ Sound effects (with fallback to Web Audio API)
- ✅ Responsive design for mobile and desktop
- ✅ Admin panel for tracking assignments
- ✅ Audit logs for all actions
- ✅ Reset functionality for administrators
- ✅ Session management to prevent duplicate spins

## Customization

### Change Number Range

Edit `app/api/available-numbers/route.ts`:

```typescript
const TOTAL_NUMBERS = 100 // Change this to your desired range
```

### Change Colors

Edit `components/SpinWheel.tsx`:

```typescript
const COLORS = [
  '#FF6B6B', '#4ECDC4', // Add your colors here
  // ...
]
```

### Change Wheel Size

Edit `components/SpinWheel.tsx`:

```typescript
<div className="relative w-full max-w-[400px] aspect-square">
  // Change max-w-[400px] to your desired size
</div>
```

## Troubleshooting

### Canvas not rendering
- Make sure the canvas element is mounted before drawing
- Check browser console for errors

### Sound effects not playing
- Check browser autoplay policies
- Ensure sound files are in `public/sounds/` directory
- The app will fallback to Web Audio API if files are missing

### Database connection errors
- Verify your Supabase credentials in `.env.local`
- Check that RLS policies allow operations
- Ensure tables are created correctly

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (should be 18+)
- Clear `.next` folder and rebuild

## Support

For issues or questions, please check:
- Next.js documentation: https://nextjs.org/docs
- Supabase documentation: https://supabase.com/docs
- Vercel documentation: https://vercel.com/docs

