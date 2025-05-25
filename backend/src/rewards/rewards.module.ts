import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardsService } from './rewards.service';
import { Trade, TradeSchema } from '../trade/trade.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Trade', schema: TradeSchema }]),
  ],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}