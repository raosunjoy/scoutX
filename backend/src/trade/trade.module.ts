import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';
import { Trade, TradeSchema } from './trade.schema';
import { Cohort, CohortSchema } from '../cohort/cohort.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Trade', schema: TradeSchema },
      { name: 'Cohort', schema: CohortSchema },
    ]),
  ],
  controllers: [TradeController],
  providers: [TradeService],
})
export class TradeModule {}