import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from '../cohort/cohort.schema';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectModel(Cohort.name) private cohortModel: Model<Cohort>,
    private readonly redisService: RedisService,
  ) {}

  async someMethod(cohortId: string) {
    try {
      const cacheKey = `reward:${cohortId}`;
      const cachedData = await this.redisService.get(cacheKey);
      if (cachedData) {
        this.logger.log(`Returning cached reward data for cohort ${cohortId}`);
        return JSON.parse(cachedData);
      }

      const cohort = await this.cohortModel.findOne({ cohortId }).lean();
      if (!cohort) {
        throw new Error(`Cohort with ID ${cohortId} not found`);
      }

      await this.redisService.set(cacheKey, JSON.stringify(cohort), 3600);
      this.logger.log(`Fetched and cached reward data for cohort ${cohortId}`);
      return cohort;
    } catch (err) {
      this.logger.error(`Error in someMethod for cohort ${cohortId}: ${err.message}`, err.stack);
      throw err;
    }
  }
}

