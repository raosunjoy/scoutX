import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.logger.log(`Connecting to Redis at ${redisUrl}`);
    this.redis = new Redis(redisUrl);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, expiry?: number): Promise<void> {
    if (expiry) {
      await this.redis.set(key, value, 'EX', expiry);
    } else {
      await this.redis.set(key, value);
    }
  }
}

