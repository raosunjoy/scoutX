import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trade } from './trade.schema';
import { Cohort } from '../cohort/cohort.schema';
import { WebSocketServer } from 'ws';
import { Redis } from 'ioredis';

@Injectable()
export class TradeService {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private wss: WebSocketServer;

  constructor(
    @InjectModel('Trade') private tradeModel: Model<Trade>,
    @InjectModel('Cohort') private cohortModel: Model<Cohort>,
  ) {
    this.wss = new WebSocketServer({ port: 8080 });
    this.wss.on('connection', (ws) => {
      console.log('Client connected to WebSocket');
      ws.on('close', () => console.log('Client disconnected'));
    });
  }

  async executeTrade({ userWallet, cohortId, amount, price, type }: {
    userWallet: string;
    cohortId: string;
    amount: number;
    price: number;
    type: string;
  }) {
    if (!userWallet || !cohortId || !amount || !price || !type) {
      throw new Error('Missing required fields');
    }

    if (amount <= 0 || price <= 0) {
      throw new Error('Amount and price must be positive');
    }

    if (!['buy', 'sell'].includes(type)) {
      throw new Error('Invalid trade type');
    }

    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    const portfolio = await this.getPortfolio(userWallet);
    const holdings = portfolio.holdings.find(h => h.cohortId === cohortId)?.amount || 0;

    if (type === 'sell' && holdings < amount) {
      throw new Error('Insufficient tokens to sell');
    }

    // Simulate balance check for buy (in production, integrate with Solana wallet)
    if (type === 'buy') {
      const totalCost = amount * price;
      const simulatedBalance = 1000000; // Simulated wallet balance in USD
      if (totalCost > simulatedBalance) {
        throw new Error('Insufficient balance to buy');
      }
    }

    const feeRate = 0.01; // 1% fee
    const fee = amount * price * feeRate;

    const trade = new this.tradeModel({
      userWallet,
      cohortId,
      amount,
      price,
      type,
      fee,
      timestamp: new Date(),
      transactionId: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
    await trade.save();

    // Update latest price in Redis
    await this.redis.set(`price:${cohortId}`, JSON.stringify({ price, timestamp: new Date() }), 'EX', 3600);

    // Emit price update via WebSocket
    this.wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ cohortId, price }));
      }
    });

    return {
      transaction: trade.transactionId,
      fee: fee.toFixed(2),
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} executed successfully`,
    };
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
      const priceData = await this.redis.get(`price:${cohortId}`);
      const latestPrice = priceData ? JSON.parse(priceData).price : 0;
      const value = amount * latestPrice;
      holdings.push({ cohortId, amount, latestPrice, value });
    }

    return { userWallet, holdings, totalValue: holdings.reduce((sum, h) => sum + h.value, 0) };
  }
}