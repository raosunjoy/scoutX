import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trade } from './trade.schema';
import { Cohort } from '../cohort/cohort.schema';
import { WebSocketServer } from 'ws';
import { Redis } from 'ioredis';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, transfer, TOKEN_PROGRAM_ID } from '@solana/spl-token';

@Injectable()
export class TradeService {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  private wss: WebSocketServer;
  private connection: Connection;

  constructor(
    @InjectModel('Trade') private tradeModel: Model<Trade>,
    @InjectModel('Cohort') private cohortModel: Model<Cohort>,
  ) {
    this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
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

    const adminWalletSecret = process.env.ADMIN_WALLET_SECRET;
    if (!adminWalletSecret) {
      throw new Error('Admin wallet secret not provided');
    }
    const adminWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(adminWalletSecret)));

    const userPublicKey = new PublicKey(userWallet);
    const tokenMint = new PublicKey(cohort.tokenAddress);

    const userTokenAccountAddress = await getAssociatedTokenAddress(tokenMint, userPublicKey);
    const adminTokenAccountAddress = await getAssociatedTokenAddress(tokenMint, adminWallet.publicKey);

    const userTokenAccount = await getAccount(this.connection, userTokenAccountAddress);
    const adminTokenAccount = await getAccount(this.connection, adminTokenAccountAddress);

    if (type === 'sell' && Number(userTokenAccount.amount) < amount) {
      throw new Error('Insufficient tokens to sell');
    }

    if (type === 'buy' && Number(adminTokenAccount.amount) < amount) {
      throw new Error('Insufficient tokens in admin account to buy');
    }

    const baseFeeRate = 0.02; // 2% base fee
    const highVolumeFeeRate = amount > 500 ? 0.01 : 0; // 1% additional for trades > 500 tokens
    const feeRate = baseFeeRate + highVolumeFeeRate;
    const fee = amount * price * feeRate;

    if (type === 'buy') {
      await transfer(
        this.connection,
        adminWallet,
        adminTokenAccountAddress,
        userTokenAccountAddress,
        adminWallet.publicKey,
        amount,
        [],
        TOKEN_PROGRAM_ID
      );
    } else {
      await transfer(
        this.connection,
        adminWallet,
        userTokenAccountAddress,
        adminTokenAccountAddress,
        userPublicKey,
        amount,
        [],
        TOKEN_PROGRAM_ID
      );
    }

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

    await this.redis.set(`price:${cohortId}`, JSON.stringify({ price, timestamp: new Date() }), 'EX', 3600);

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