import { Injectable } from '@nestjs/common';
import { RedisClientType } from '@liaoliaots/nestjs-redis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

@Injectable()
export class RedisService {
  constructor(
    @InjectRedis() private readonly redis: RedisClientType,
  ) {}

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

