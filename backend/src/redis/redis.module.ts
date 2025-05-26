import { Module } from '@nestjs/common';
   import { RedisService } from './redis.service';
   import IORedis from 'ioredis';

   @Module({
     providers: [
       RedisService,
       {
         provide: 'REDIS_CLIENT',
         useFactory: () => {
           const client = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
             maxRetriesPerRequest: 3,
             retryStrategy(times) {
               const delay = Math.min(times * 500, 2000); // Exponential backoff, max 2 seconds
               console.warn(`Retrying Redis connection (${times}) after ${delay}ms`);
               return delay;
             },
           });
           return client;
         },
       },
     ],
     exports: [RedisService],
   })
   export class RedisModule {}