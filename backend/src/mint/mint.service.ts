import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from '../cohort/cohort.schema';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

@Injectable()
export class MintService {
  constructor(@InjectModel('Cohort') private cohortModel: Model<Cohort>) {}

  async mintToken({ cohortId, sport, initialSupply }: { cohortId: string; sport: string; initialSupply: number }) {
    const existingCohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (existingCohort) {
      throw new Error('Cohort ID already exists');
    }

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const wallet = Keypair.generate(); // Simulated wallet for minting
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

    const programId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'); // Solana Token Program
    const mint = Keypair.generate();

    const signature = await connection.requestAirdrop(wallet.publicKey, 2e9); // 2 SOL for fees
    await connection.confirmTransaction(signature);

    const tokenMintTx = new web3.Transaction().add(
      web3.SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: 82,
        lamports: await connection.getMinimumBalanceForRentExemption(82),
        programId,
      }),
      // Simulate token minting (simplified for testnet)
    );

    const txSignature = await provider.sendAndConfirm(tokenMintTx, [wallet, mint]);
    const tokenAddress = mint.publicKey.toString();

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

    return { cohortId, tokenAddress, initialSupply, transaction: txSignature };
  }
}