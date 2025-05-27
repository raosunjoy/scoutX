import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { RewardsModule } from './rewards/rewards.module';
import { CohortModule } from './cohort/cohort.module';
import { TradeModule } from './trade/trade.module';
import { MintModule } from './mint/mint.module';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost/scoutx'),
    DatabaseModule,
    RedisModule,
    RewardsModule,
    CohortModule,
    TradeModule,
    MintModule,
    PortfolioModule,
  ],
})
export class AppModule {}

