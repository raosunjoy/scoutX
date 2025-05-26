import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CohortModule } from './cohort/cohort.module';
import { RewardsModule } from './rewards/rewards.module';
import { MintModule } from './mint/mint.module';
import { TradeModule } from './trade/trade.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost/scoutx'),
    DatabaseModule,
    CohortModule,
    RewardsModule,
    MintModule,
    TradeModule,
    RedisModule,
  ],
})
export class AppModule {}
