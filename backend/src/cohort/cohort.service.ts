import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from './cohort.schema';
import { Redis } from 'ioredis';
import * as tf from '@tensorflow/tfjs';

@Injectable()
export class CohortService {
  private readonly redis: Redis;
  private readonly logger = new Logger(CohortService.name);

  constructor(
    @InjectModel(Cohort.name) private cohortModel: Model<Cohort>,
  ) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.error('REDIS_URL environment variable is not set');
      throw new Error('REDIS_URL environment variable is not set');
    }
    this.logger.log(`Connecting to Redis at ${redisUrl}`);
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        this.logger.warn(`Retrying Redis connection (attempt ${times}) to ${redisUrl}`);
        return Math.min(times * 500, 3000); // Retry every 500ms, max 3 seconds
      },
      reconnectOnError: (err) => {
        this.logger.error(`Redis reconnect error: ${err.message}`, err.stack);
        return false;
      }
    });

    this.redis.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`, err.stack);
    });

    this.redis.on('connect', () => {
      this.logger.log('Successfully connected to Redis');
    });
  }

  async fetchCohortData(cohortId: string) {
    try {
      const cachedData = await this.redis.get(`cohort:${cohortId}`);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const cohort = await this.cohortModel.findOne({ cohortId }).exec();
      if (!cohort) {
        throw new NotFoundException(`Cohort with ID ${cohortId} not found`);
      }

      const successScore = this.calculateSuccessScore(cohort);
      cohort.successScore = successScore;

      cohort.highlights = await Promise.all(
        cohort.highlights.map(async (highlight: { uri: string; data?: string }) => {
          return { uri: highlight.uri, data: highlight.data || 'Mock data' };
        }),
      );

      await this.redis.set(
        `cohort:${cohortId}`,
        JSON.stringify(cohort),
        'EX',
        3600,
      );

      return cohort;
    } catch (err) {
      this.logger.error(`Error fetching cohort data for ${cohortId}: ${err.message}`, err.stack);
      throw err;
    }
  }

  private calculateSuccessScore(cohort: Cohort): number {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [Object.keys(cohort.stats).length] }));
    model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

    const statsArray = Object.values(cohort.stats);
    const xs = tf.tensor2d([statsArray], [1, statsArray.length]);
    const prediction = model.predict(xs) as tf.Tensor;
    const score = prediction.dataSync()[0];
    return Math.min(Math.max(score, 0), 1);
  }
}

