import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs/redis';

@Module({
  imports: [
    NestRedisModule.forRoot({
      url: process.env.REDIS_URL,
    }),
  ],
  exports: [NestRedisModule],
})
export class RedisModule {}
