import { Redis } from '@upstash/redis';

type Session = {
  code: string;
  users: { id: string; name: string }[];
  messages: { user: string; message: string; timestamp: number }[];
  createdAt: number;
};

const localSessions = new Map<string, Session>();

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    console.log('[Storage] Using Upstash Redis for session storage');
  } catch (err) {
    console.error('[Storage] Failed to initialize Redis:', err);
    redis = null;
  }
} else {
  console.log('[Storage] Using in-memory storage (local development)');
  console.log('[Storage] To use Redis, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
}

export const sessionStorage = {
  async get(code: string): Promise<Session | null> {
    if (redis) {
      try {
        const session = await redis.get<Session>(`session:${code}`);
        console.log(`[Storage] Get session ${code}:`, session ? 'FOUND' : 'NOT FOUND');
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
        await redis.set(`session:${code}`, session, { ex: 86400 });
        console.log(`[Storage] Set session ${code} in Redis`);
      } catch (err) {
        console.error('Redis set error:', err);
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

  get size(): number {
    return localSessions.size;
  },
};
