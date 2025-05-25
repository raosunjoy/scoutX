import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from '../cohort/cohort.schema';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

@Injectable()
export class MintService {
  constructor(@InjectModel('Cohort') private cohortModel: Model<Cohort>) {}

  async mintToken({ cohortId, sport, initialSupply }: { cohortId: string; sport: string; initialSupply: number }) {
    const existingCohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (existingCohort) {
      throw new Error('Cohort ID already exists');
    }

    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Load admin wallet (private key should be in env for production)
    const adminWalletSecret = process.env.ADMIN_WALLET_SECRET;
    if (!adminWalletSecret) {
      throw new Error('Admin wallet secret not provided');
    }
    const adminWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(adminWalletSecret)));

    // Create a new mint (token)
    const mint = await createMint(
      connection,
      adminWallet, // Payer
      adminWallet.publicKey, // Mint authority
      null, // Freeze authority (null means no freeze)
      0 // Decimals
    );

    // Create or get associated token account for admin
    const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      adminWallet,
      mint,
      adminWallet.publicKey
    );

    // Mint initial supply to admin's token account
    await mintTo(
      connection,
      adminWallet,
      mint,
      adminTokenAccount.address,
      adminWallet.publicKey,
      initialSupply
    );

    const tokenAddress = mint.toString();

    // Save cohort to MongoDB
    const newCohort = new this.cohortModel({
      cohortId,
      sport,
      stats: sport === 'cricket' ? { battingAverage: 0 } :
             sport === 'football' ? { passingAccuracy: 0 } :
             { shootingAccuracy: 0, threePointPercentage: 0 },
      highlights: [],
      timestamp: new Date(),
    });
    await newCohort.save();

    return { cohortId, tokenAddress, initialSupply, transaction: adminTokenAccount.address.toString() };
  }
}