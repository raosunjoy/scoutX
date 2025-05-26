import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@liaoliaots/nestjs-redis';
import { URL } from 'url';

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
  exports: [NestRedisModule],
})
export class RedisModule {}
