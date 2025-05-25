import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CohortController } from './cohort.controller';
import { CohortService } from './cohort.service';
import { Cohort, CohortSchema } from './cohort.schema';
import { Trade, TradeSchema } from '../trade/trade.schema';
import { IpfsModule } from '../ipfs/ipfs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Cohort', schema: CohortSchema },
      { name: 'Trade', schema: TradeSchema },
    ]),
    IpfsModule,
  ],
  controllers: [CohortController],
  providers: [CohortService],
})
export class CohortModule {}