import Redis from 'ioredis';

// Storage abstraction that works both locally and on Vercel
type Session = {
  code: string;
  users: { id: string; name: string }[];
  messages: { user: string; message: string; timestamp: number }[];
  createdAt: number;
};

// In-memory fallback for local development
const localSessions = new Map<string, Session>();

// Initialize Redis if REDIS_URL is available
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Connect and handle errors
    redis.connect().then(() => {
      console.log('[Storage] Connected to Redis');
    }).catch((err) => {
      console.error('[Storage] Redis connection failed:', err);
      redis = null;
    });

    redis.on('error', (err) => {
      console.error('[Storage] Redis error:', err);
    });

    console.log('[Storage] Using Redis for session storage');
  } catch (err) {
    console.error('[Storage] Failed to initialize Redis:', err);
    redis = null;
  }
}

if (!redis) {
  console.log('[Storage] Using in-memory storage (local development)');
}

export const sessionStorage = {
  async get(code: string): Promise<Session | null> {
    if (redis) {
      try {
        const data = await redis.get(`session:${code}`);
        if (data) {
          const session = JSON.parse(data) as Session;
          console.log(`[Storage] Get session ${code}: FOUND`);
          return session;
        }
        console.log(`[Storage] Get session ${code}: NOT FOUND`);
        return null;
      } catch (err) {
        console.error('Redis get error:', err);
        return null;
      }
    }
    return localSessions.get(code) || null;
  },

  async set(code: string, session: Session): Promise<void> {
    if (redis) {
      try {
        // Set with 24 hour expiration (86400 seconds)
        await redis.setex(`session:${code}`, 86400, JSON.stringify(session));
        console.log(`[Storage] Set session ${code} in Redis`);
      } catch (err) {
        console.error('Redis set error:', err);
        // Fallback to local
        localSessions.set(code, session);
      }
    } else {
      localSessions.set(code, session);
    }
  },

  async has(code: string): Promise<boolean> {
    if (redis) {
      try {
        const exists = await redis.exists(`session:${code}`);
        return exists === 1;
      } catch (err) {
        console.error('Redis exists error:', err);
        return false;
      }
    }
    return localSessions.has(code);
  },

  async delete(code: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(`session:${code}`);
      } catch (err) {
        console.error('Redis delete error:', err);
      }
    }
    localSessions.delete(code);
  },

  // Get size (only works locally)
  get size(): number {
    return localSessions.size;
  },
};
