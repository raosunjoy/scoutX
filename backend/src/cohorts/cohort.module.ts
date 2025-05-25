import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CohortController } from './cohort.controller';
import { CohortService } from './cohort.service';
import { PlayerService } from './player.service';
import { Cohort, CohortSchema } from './cohort.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Cohort', schema: CohortSchema }]),
  ],
  controllers: [CohortController],
  providers: [CohortService, PlayerService],
  exports: [CohortService, PlayerService],
})
export class CohortModule {}