import { Module } from '@nestjs/common';
import { CohortController } from './cohort.controller';
import { CohortService } from './cohort.service';
import { PlayerService } from './player.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CohortController],
  providers: [CohortService, PlayerService],
  exports: [CohortService, PlayerService],
})
export class CohortModule {}