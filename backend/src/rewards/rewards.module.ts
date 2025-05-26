import { Module } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module'; // Updated import path

@Module({
  imports: [DatabaseModule, RedisModule],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}