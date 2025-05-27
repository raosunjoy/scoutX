import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from '../cohort/cohort.schema';
import { WebSocketServer } from 'ws';
import { Redis } from 'ioredis';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, transfer, TOKEN_PROGRAM_ID } from '@solana/spl-token';

@Injectable()
export class TradeService {
  private wss: WebSocketServer;
  private readonly redis: Redis;
  private readonly logger = new Logger(TradeService.name);

  constructor(
    @InjectModel(Cohort.name) private cohortModel: Model<Cohort>,
  ) {
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

    this.wss = new WebSocketServer({ port: 8080 });

    this.wss.on('connection', (ws) => {
      ws.on('message', async (message) => {
        try {
          const { cohortId, price } = JSON.parse(message.toString());
          await this.redis.set(`price:${cohortId}`, price, 'EX', 3600);
          this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ cohortId, price }));
            }
          });
        } catch (err) {
          this.logger.error(`Error handling WebSocket message: ${err.message}`, err.stack);
        }
      });
    });
  }

  async tradeToken(userWallet: string, cohortId: string, amount: number, price: number, type: 'buy' | 'sell') {
    try {
      const cohort = await this.cohortModel.findOne({ cohortId }).exec();
      if (!cohort) {
        throw new Error('Cohort not found');
      }

      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const adminWalletSecret = process.env.ADMIN_WALLET_SECRET || '[]';
      const adminWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(adminWalletSecret)));
      const userPublicKey = new PublicKey(userWallet);
      const mintPublicKey = new PublicKey(cohortId);

      const adminTokenAccount = await getAssociatedTokenAddress(mintPublicKey, adminWallet.publicKey);
      const userTokenAccount = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);

      if (type === 'buy') {
        await transfer(
          connection,
          adminWallet,
          adminTokenAccount,
          userTokenAccount,
          adminWallet.publicKey,
          amount,
          [],
          { commitment: 'confirmed' },
          TOKEN_PROGRAM_ID,
        );
      } else {
        await transfer(
          connection,
          adminWallet,
          userTokenAccount,
          adminTokenAccount,
          adminWallet.publicKey,
          amount,
          [],
          { commitment: 'confirmed' },
          TOKEN_PROGRAM_ID,
        );
      }

      const transaction = `TX_${Date.now()}`;
      cohort.tradeHistory.push(transaction);
      await cohort.save();

      await this.redis.set(`price:${cohortId}`, price.toString(), 'EX', 3600);
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ cohortId, price }));
        }
      });

      return { transaction, fee: amount * 0.01 };
    } catch (err) {
      this.logger.error(`Error in tradeToken: ${err.message}`, err.stack);
      throw err;
    }
  }
}

