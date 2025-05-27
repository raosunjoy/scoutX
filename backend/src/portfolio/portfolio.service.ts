import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trade } from '../trade/trade.schema';
import { Redis } from 'ioredis';

@Injectable()
export class PortfolioService {
  private readonly redis: Redis;
  private readonly logger = new Logger(PortfolioService.name);

  constructor(@InjectModel('Trade') private tradeModel: Model<Trade>) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.error('REDIS_URL environment variable is not set');
      throw new Error('REDIS_URL environment variable is not set');
    }
    this.logger.log(`Connecting to Redis at ${redisUrl}`);
    this.redis = new Redis(redisUrl);

    this.redis.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`, err.stack);
    });

    this.redis.on('connect', () => {
      this.logger.log('Successfully connected to Redis');
    });
  }

  async getPortfolio(userWallet: string) {
    const trades = await this.tradeModel.find({ userWallet }).lean();
    const holdingsMap: { [cohortId: string]: number } = {};

    trades.forEach((trade) => {
      const { cohortId, amount, type } = trade;
      if (!holdingsMap[cohortId]) {
        holdingsMap[cohortId] = 0;
      }
      if (type === 'buy') {
        holdingsMap[cohortId] += amount;
      } else if (type === 'sell') {
        holdingsMap[cohortId] -= amount;
      }
    });

    const holdings = [];
    for (const [cohortId, amount] of Object.entries(holdingsMap)) {
      if (amount <= 0) continue;
      try {
        const priceData = await this.redis.get(`price:${cohortId}`);
        const latestPrice = priceData ? JSON.parse(priceData).price : 0;
        const value = amount * latestPrice;
        holdings.push({ cohortId, amount, latestPrice, value });
      } catch (err) {
        this.logger.error(`Error fetching price for cohort ${cohortId}: ${err.message}`, err.stack);
        throw err;
      }
    }

    return { userWallet, holdings, totalValue: holdings.reduce((sum, h) => sum + h.value, 0) };
  }
}

