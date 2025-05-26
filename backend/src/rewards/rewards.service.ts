import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Cohort } from '../cohort/cohort.schema';
import { RedisService } from '../redis/redis.service'; // Updated import path

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(Cohort.name) private cohortModel: Model<Cohort>,
    private redisService: RedisService,
  ) {}

  async calculateRewards(cohortId: string) {
    const cached = await this.redisService.get(`rewards:${cohortId}`);
    if (cached) return JSON.parse(cached);

    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    const rewards = this.computeRewards(cohort);
    await this.redisService.set(`rewards:${cohortId}`, JSON.stringify(rewards));
    return rewards;
  }

  private computeRewards(cohort: Cohort) {
    // Placeholder logic
    return { cohortId: cohort.cohortId, points: 100 };
  }
}