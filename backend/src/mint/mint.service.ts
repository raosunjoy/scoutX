import { Injectable, Logger } from '@nestjs/common';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';

@Injectable()
export class MintService {
  private readonly logger = new Logger(MintService.name);

  async mintToken(userWallet: string, cohortId: string, amount: number) {
    try {
      this.logger.log('Starting mintToken process');
      
      // Initialize connection to public devnet RPC
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      this.logger.log('Connected to Solana devnet RPC');
      
      // Load admin wallet
      this.logger.log('Parsing ADMIN_WALLET_SECRET');
      const adminWalletSecret = process.env.ADMIN_WALLET_SECRET || '[]';
      const adminWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(adminWalletSecret)));
      const adminPublicKey = adminWallet.publicKey;
      this.logger.log(`Admin public key: ${adminPublicKey.toBase58()}`);

      // Load user wallet
      this.logger.log(`Creating PublicKey for userWallet: ${userWallet}`);
      const userPublicKey = new PublicKey(userWallet);
      this.logger.log(`User public key: ${userPublicKey.toBase58()}`);

      // Load mint address
      const mintAddress = process.env.MINT_ADDRESS;
      this.logger.log(`Creating PublicKey for MINT_ADDRESS: ${mintAddress}`);
      const mintPublicKey = new PublicKey(mintAddress);
      this.logger.log(`Mint public key: ${mintPublicKey.toBase58()}`);

      // Log TOKEN_PROGRAM_ID
      this.logger.log(`TOKEN_PROGRAM_ID: ${TOKEN_PROGRAM_ID.toBase58()}`);

      // Derive associated token accounts
      this.logger.log('Deriving admin token account');
      const adminTokenAccount = await getAssociatedTokenAddress(mintPublicKey, adminPublicKey);
      this.logger.log(`Admin token account: ${adminTokenAccount.toBase58()}`);

      this.logger.log('Deriving user token account');
      const userTokenAccount = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);
      this.logger.log(`User token account: ${userTokenAccount.toBase58()}`);

      // Mint tokens
      this.logger.log(`Minting ${amount} tokens to user token account with authority ${adminPublicKey.toBase58()}`);
      await mintTo(
        connection,
        adminWallet, // Payer
        mintPublicKey, // Mint
        userTokenAccount, // Destination
        adminPublicKey, // Mint authority
        amount,
        [], // No additional signers
        { commitment: 'confirmed' },
        TOKEN_PROGRAM_ID // Use the default token program
      );

      this.logger.log(`Successfully minted ${amount} tokens to ${userWallet}`);
      return { success: true, message: `Minted ${amount} tokens to ${userWallet}` };
    } catch (err) {
      this.logger.error(`Error in mintToken: ${err.message}`, err.stack);
      throw err;
    }
  }
}

