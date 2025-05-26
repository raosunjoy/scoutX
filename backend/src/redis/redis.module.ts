import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@liaoliaots/nestjs-redis';
import { URL } from 'url';
import { RedisService } from './redis.service';

@Module({
  imports: [
    NestRedisModule.forRoot({
      config: {
        url: process.env.REDIS_URL,
        host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname,
        port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port || '6379', 10),
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

