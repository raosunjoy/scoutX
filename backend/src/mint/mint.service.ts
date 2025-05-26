import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cohort } from '../cohort/cohort.schema';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  Idl,
  setProvider,
  BN,
} from '@coral-xyz/anchor';
import * as mockProgramIdl from './idl/mock-program.json';
import { MockProgramIdl } from './idl/mock-program-idl';

// Wallet interface supporting both transaction types
interface Wallet {
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
  publicKey: PublicKey;
}

@Injectable()
export class MintService {
  private readonly logger = new Logger(MintService.name);

  constructor(
    @InjectModel(Cohort.name) private cohortModel: Model<Cohort>,
  ) {}

  async mintToken(userWallet: string, cohortId: string, amount: number) {
    // 1. Fetch Cohort
    const cohort = await this.cohortModel.findOne({ cohortId }).exec();
    if (!cohort) {
      throw new Error('Cohort not found');
    }

    // 2. Setup Solana Connection
    const connection = new Connection('https://tyo74.nodes.rpcpool.com', 'confirmed');

    // 3. Load Admin Keypair
    const adminWalletSecret = process.env.ADMIN_WALLET_SECRET || '[]';
    let adminKeypair: Keypair;
    try {
      const secretArray = JSON.parse(adminWalletSecret);
      if (!Array.isArray(secretArray) || secretArray.length !== 64) {
        throw new Error('Invalid secret format');
      }
      adminKeypair = Keypair.fromSecretKey(Uint8Array.from(secretArray));
    } catch (err) {
      this.logger.error('Invalid ADMIN_WALLET_SECRET', err.stack);
      throw new Error('Failed to load admin wallet secret');
    }

    // 4. Define Wallet Adapter
    const wallet: Wallet = {
      publicKey: adminKeypair.publicKey,
      async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
        if (tx instanceof Transaction) {
          tx.sign(adminKeypair);
        } else if (tx instanceof VersionedTransaction) {
          tx.sign([adminKeypair]);
        }
        return tx;
      },
      async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
        return Promise.all(
          txs.map(async (tx) => {
            if (tx instanceof Transaction) {
              tx.sign(adminKeypair);
            } else if (tx instanceof VersionedTransaction) {
              tx.sign([adminKeypair]);
            }
            return tx;
          }),
        );
      },
    };

    // 5. Create Provider & Program
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    setProvider(provider);

    const programId = new PublicKey(process.env.MOCK_PROGRAM_ID || 'YourProgramIdHere');
    const program = new Program(mockProgramIdl as unknown as Idl, programId);

    // 6. Derive token account (placeholder logic, adjust as needed)
    const userPublicKey = new PublicKey(userWallet);
    const tokenAccount = userPublicKey; // TODO: derive actual token account if needed

    // 7. Call mint function
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

      return {
        success: true,
        message: `Minted ${amount} tokens to ${userWallet}`,
      };
    } catch (error) {
      this.logger.error('Minting failed', error.stack);
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }
}

