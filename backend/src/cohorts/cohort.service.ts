import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from './cohort.schema';
import { Trade } from '../trade/trade.schema';
import { IpfsService } from '../ipfs/ipfs.service';
import { Redis } from 'ioredis';
import * as tf from '@tensorflow/tfjs-node';

@Injectable()
export class CohortService {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  constructor(
    @InjectModel('Cohort') private cohortModel: Model<Cohort>,
    @InjectModel('Trade') private tradeModel: Model<Trade>,
    private ipfsService: IpfsService,
  ) {}

  async fetchCohortData(cohortId: string) {
    const cached = await this.redis.get(`cohort:${cohortId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const cohort = await this.cohortModel.findOne({ cohortId }).lean();
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    const highlights = await Promise.all(
      cohort.highlights.map(async (uri: string) => {
        const data = await this.ipfsService.fetch(uri);
        return { uri, data };
      }),
    );

    const trades = await this.tradeModel.find({ cohortId }).sort({ timestamp: 1 }).lean();
    const tradeHistory = trades.map((trade) => ({
      price: trade.price,
      timestamp: trade.timestamp,
    }));

    let modelPath: string;
    if (cohort.sport === 'cricket') {
      modelPath = 'file://./models/cricket-success-score-model';
    } else if (cohort.sport === 'football') {
      modelPath = 'file://./models/football-success-score-model';
    } else if (cohort.sport === 'basketball') {
      modelPath = 'file://./models/basketball-success-score-model';
    } else {
      throw new Error('Unsupported sport');
    }

    const model = await tf.loadLayersModel(modelPath);
    const statsTensor = tf.tensor2d([Object.values(cohort.stats)]);
    const successScore = model.predict(statsTensor).dataSync()[0];

    const result = {
      cohortId: cohort.cohortId,
      sport: cohort.sport,
      stats: cohort.stats,
      highlights,
      successScore,
      tradeHistory,
      timestamp: cohort.timestamp,
    };

    await this.redis.set(`cohort:${cohortId}`, JSON.stringify(result), 'EX', 3600);
    return result;
  }
}