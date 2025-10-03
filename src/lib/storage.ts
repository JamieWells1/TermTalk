import { Redis } from '@upstash/redis';

// Storage abstraction that works both locally and on Vercel
type Session = {
  code: string;
  users: { id: string; name: string }[];
  messages: { user: string; message: string; timestamp: number }[];
  createdAt: number;
};

// In-memory fallback for local development
const localSessions = new Map<string, Session>();

// Initialize Redis if credentials are available
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('[Storage] Using Redis for session storage');
} else {
  console.log('[Storage] Using in-memory storage (local development)');
}

export const sessionStorage = {
  async get(code: string): Promise<Session | null> {
    if (redis) {
      try {
        const session = await redis.get<Session>(`session:${code}`);
        return session;
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
        await redis.set(`session:${code}`, JSON.stringify(session), { ex: 86400 });
      } catch (err) {
        console.error('Redis set error:', err);
      }
    }
    localSessions.set(code, session);
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
