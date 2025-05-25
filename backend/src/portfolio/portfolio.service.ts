import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trade } from '../trade/trade.schema';
import { Redis } from 'ioredis';

@Injectable()
export class PortfolioService {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  constructor(@InjectModel('Trade') private tradeModel: Model<Trade>) {}

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
      const priceData = await this.redis.get(`price:${cohortId}`);
      const latestPrice = priceData ? JSON.parse(priceData).price : 0;
      const value = amount * latestPrice;
      holdings.push({ cohortId, amount, latestPrice, value });
    }

    return { userWallet, holdings, totalValue: holdings.reduce((sum, h) => sum + h.value, 0) };
  }
}