# Secret Santa Spinning Wheel

A modern, interactive spinning wheel application built with Next.js, Supabase, and deployed on Vercel.

## Features

- 🎯 User-friendly form for name and employee ID entry
- 🎡 Interactive spinning wheel with smooth animations
- 🎉 Celebratory confetti animations on result display
- 🔊 Sound effects for spinning and stopping
- 📱 Fully responsive design for desktop and mobile
- 👨‍💼 Admin panel for tracking assignments and resetting numbers
- 🔒 Session management to prevent duplicate spins

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Supabase
- **Deployment**: Vercel
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Confetti**: Canvas Confetti

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

Run the SQL script in `supabase/schema.sql` to set up your database tables.

## Deployment

Deploy to Vercel:
```bash
vercel
```

Make sure to add your Supabase environment variables in the Vercel dashboard.

