import { Controller, Get, Query } from '@nestjs/common';
import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('some-method')
  async someMethod(@Query('cohortId') cohortId: string) {
    if (!cohortId) {
      throw new Error('cohortId query parameter is required');
    }
    return this.rewardsService.someMethod(cohortId);
  }
}

