import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from '../cohort/cohort.schema';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(Cohort.name) private cohortModel: Model<Cohort>,
    private readonly redisService: RedisService,
  ) {}

  // Example method
  async someMethod() {
    await this.redisService.get('some-key');
    return this.cohortModel.find().exec();
  }
}

