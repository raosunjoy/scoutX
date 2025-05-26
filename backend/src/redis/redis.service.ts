import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis | null = null;

  constructor(@Inject('REDIS_CLIENT') redisClient: Redis) {
    this.client = redisClient;
    this.client.on('error', (err) => {
      console.error('Redis error:', err.message);
      this.client = null; // Disable Redis if connection fails
    });
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error('Redis get error:', err.message);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, value);
    } catch (err) {
      console.error('Redis set error:', err.message);
    }
  }
}