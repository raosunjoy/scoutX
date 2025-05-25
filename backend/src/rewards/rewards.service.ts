import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trade } from '../trade/trade.schema';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, transfer, TOKEN_PROGRAM_ID } from '@solana/spl-token';

@Injectable()
export class RewardsService {
  private connection: Connection;

  constructor(@InjectModel('Trade') private tradeModel: Model<Trade>) {
    this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  }

  async airdropTokens(userWallet: string, amount: number, cohortId: string) {
    const adminWalletSecret = process.env.ADMIN_WALLET_SECRET;
    if (!adminWalletSecret) {
      throw new Error('Admin wallet secret not provided');
    }
    const adminWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(adminWalletSecret)));

    const userPublicKey = new PublicKey(userWallet);
    const tokenMint = new PublicKey(cohortId); // Cohort's token address

    const userTokenAccountAddress = await getAssociatedTokenAddress(tokenMint, userPublicKey);
    const adminTokenAccountAddress = await getAssociatedTokenAddress(tokenMint, adminWallet.publicKey);

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

    return { message: `${amount} tokens airdropped to ${userWallet}` };
  }

  async getTopTrader(cohortId: string, startDate: Date, endDate: Date) {
    const trades = await this.tradeModel
      .aggregate([
        { $match: { cohortId, timestamp: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$userWallet', totalVolume: { $sum: { $multiply: ['$amount', '$price'] } } } },
        { $sort: { totalVolume: -1 } },
        { $limit: 1 },
      ])
      .exec();

    return trades.length > 0 ? { userWallet: trades[0]._id, totalVolume: trades[0].totalVolume } : null;
  }
}