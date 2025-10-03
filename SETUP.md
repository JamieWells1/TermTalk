# TermTalk Setup Guide

## Setting up Redis for Vercel Deployment

### Step 1: Create Upstash Redis Database

1. Go to your **Vercel Dashboard** → Select your project
2. Click on **Storage** tab
3. Click **Create Database** → Select **Upstash Redis**
4. Follow the prompts to create a new Redis database
5. Vercel will automatically connect it to your project

### Step 2: Get Your Redis Credentials

After creating the Redis database in Vercel:

1. In Vercel, go to **Settings** → **Environment Variables**
2. You should see two variables automatically added:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

These are automatically set by Vercel when you create the database.

### Step 3: Deploy

Once the Redis database is connected:

```bash
git add .
git commit -m "Add Redis support for persistent sessions"
git push
```

Vercel will automatically redeploy with the Redis environment variables.

### Step 4: Update Base URL

In Vercel environment variables, add:

```
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

Replace `your-app.vercel.app` with your actual Vercel deployment URL.

## Local Development

For local development, the app uses in-memory storage (no Redis needed). Just run:

```bash
npm run dev
```

If you want to test with Redis locally:

1. Get your Redis credentials from Upstash dashboard
2. Create `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_token
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

## How It Works

- **Local**: Uses in-memory Map for sessions (fast, no setup)
- **Production**: Uses Upstash Redis for persistent sessions across serverless functions
- The code automatically detects which storage to use based on environment variables

## Testing

1. Create a session on the web interface
2. Copy the terminal command
3. Run it in your terminal
4. Have a friend join with the session code
5. Chat in real-time!
