import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

// Upstash Redis client for serverless environments - lazy initialization
let _upstashRedis: Redis | null = null;
export const upstashRedis = {
  get client() {
    if (!_upstashRedis) {
      _upstashRedis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
    }
    return _upstashRedis;
  }
};

// Traditional Redis client for local development or self-hosted Redis
export const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// Cache service with automatic fallback
export class CacheService {
  private useUpstash: boolean;

  constructor() {
    // Use Upstash if credentials are provided, otherwise use local Redis
    this.useUpstash = !!(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    );
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.useUpstash) {
        return await upstashRedis.client.get(key);
      } else {
        return await redis.get(key);
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (this.useUpstash) {
        if (ttlSeconds) {
          await upstashRedis.client.setex(key, ttlSeconds, value);
        } else {
          await upstashRedis.client.set(key, value);
        }
        return true;
      } else {
        if (ttlSeconds) {
          await redis.setex(key, ttlSeconds, value);
        } else {
          await redis.set(key, value);
        }
        return true;
      }
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (this.useUpstash) {
        await upstashRedis.client.del(key);
      } else {
        await redis.del(key);
      }
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.useUpstash) {
        const result = await upstashRedis.client.exists(key);
        return result === 1;
      } else {
        const result = await redis.exists(key);
        return result === 1;
      }
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      if (this.useUpstash) {
        const result = await upstashRedis.client.incr(key);
        if (ttlSeconds) {
          await upstashRedis.client.expire(key, ttlSeconds);
        }
        return result;
      } else {
        const result = await redis.incr(key);
        if (ttlSeconds) {
          await redis.expire(key, ttlSeconds);
        }
        return result;
      }
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  async setHash(key: string, field: string, value: string): Promise<boolean> {
    try {
      if (this.useUpstash) {
        await upstashRedis.client.hset(key, { [field]: value });
      } else {
        await redis.hset(key, field, value);
      }
      return true;
    } catch (error) {
      console.error('Cache setHash error:', error);
      return false;
    }
  }

  async getHash(key: string, field: string): Promise<string | null> {
    try {
      if (this.useUpstash) {
        return await upstashRedis.client.hget(key, field);
      } else {
        return await redis.hget(key, field);
      }
    } catch (error) {
      console.error('Cache getHash error:', error);
      return null;
    }
  }

  async getAllHash(key: string): Promise<Record<string, string> | null> {
    try {
      if (this.useUpstash) {
        return await upstashRedis.client.hgetall(key);
      } else {
        return await redis.hgetall(key);
      }
    } catch (error) {
      console.error('Cache getAllHash error:', error);
      return null;
    }
  }

  async publish(channel: string, message: string): Promise<boolean> {
    try {
      if (this.useUpstash) {
        await upstashRedis.client.publish(channel, message);
      } else {
        await redis.publish(channel, message);
      }
      return true;
    } catch (error) {
      console.error('Cache publish error:', error);
      return false;
    }
  }

  // Session management
  async setSession(
    sessionId: string,
    data: any,
    ttlSeconds: number = 3600
  ): Promise<boolean> {
    return this.set(`session:${sessionId}`, JSON.stringify(data), ttlSeconds);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const data = await this.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  // Rate limiting
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const current = await this.increment(`rate_limit:${key}`, windowSeconds);
    const remaining = Math.max(0, limit - current);
    const resetTime = Date.now() + windowSeconds * 1000;

    return {
      allowed: current <= limit,
      remaining,
      resetTime,
    };
  }
}

export const cacheService = new CacheService();
