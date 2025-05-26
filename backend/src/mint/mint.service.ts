import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from '../cohort/cohort.schema';
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, setProvider, BN } from '@coral-xyz/anchor';
import { MockProgramIdl } from './idl/mock-program-idl';
import * as mockProgramIdl from './idl/mock-program.json';

// Update Wallet interface to support both Transaction and VersionedTransaction
interface Wallet {
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
  publicKey: PublicKey;
}

@Injectable()
export class MintService {
  constructor(
    @InjectModel(Cohort.name) private cohortModel: Model<Cohort>,
  ) {}

  async mintToken(userWallet: string, cohortId: string, amount: number) {
    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const adminWalletSecret = process.env.ADMIN_WALLET_SECRET || '[]';
    const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(adminWalletSecret)));

    const wallet: Wallet = {
      publicKey: adminKeypair.publicKey,
      async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
        if (tx instanceof Transaction) {
          tx.sign(adminKeypair);
          return tx;
        } else if (tx instanceof VersionedTransaction) {
          tx.sign([adminKeypair]);
          return tx;
        }
        throw new Error('Unsupported transaction type');
      },
      async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
        return Promise.all(
          txs.map(async (tx) => {
            if (tx instanceof Transaction) {
              tx.sign(adminKeypair);
              return tx;
            } else if (tx instanceof VersionedTransaction) {
              tx.sign([adminKeypair]);
              return tx;
            }
            throw new Error('Unsupported transaction type');
          }),
        );
      },
    };

    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    setProvider(provider);

    const programId = new PublicKey('YourProgramIdHere');
    const program = new Program(mockProgramIdl as unknown as Idl, programId);

    // Placeholder: In a real implementation, you'd derive the token account PDA
    const tokenAccount = new PublicKey(userWallet); // Replace with actual token account derivation

    try {
      await program.methods
        .mintToken(new BN(amount))
        .accounts({
          authority: adminKeypair.publicKey,
          tokenAccount: tokenAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([adminKeypair])
        .rpc();

      return { success: true, message: `Minted ${amount} tokens for ${userWallet}` };
    } catch (error) {
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }
}