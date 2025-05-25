import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RewardsService } from '../rewards/rewards.service';
import { Cron, CronExpression } from '@nestjs/schedule';

class ContestScheduler {
  constructor(private readonly rewardsService: RewardsService) {}

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyContest() {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cohortId = 'TEST_2026'; // Adjust for active cohorts
    const winner = await this.rewardsService.getTopTrader(cohortId, startDate, endDate);

    if (winner) {
      await this.rewardsService.airdropTokens(winner.userWallet, 100, cohortId);
      console.log(`Awarded 100 tokens to ${winner.userWallet} for trading ${winner.totalVolume}`);
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const scheduler = app.get(ContestScheduler);
  await app.enableShutdownHooks();
}

bootstrap();