import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MintModule } from './mint/mint.module';
import { TradeModule } from './trade/trade.module';
import { CohortModule } from './cohort/cohort.module';
import { PlayerModule } from './player/player.module';
import { RewardsModule } from './rewards/rewards.module';
import { WalletModule } from './wallet/wallet.module';
import { IpfsModule } from './ipfs/ipfs.module';
import { AuthModule } from './auth/auth.module';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/scoutx'),
    MintModule,
    TradeModule,
    CohortModule,
    PlayerModule,
    RewardsModule,
    WalletModule,
    IpfsModule,
    AuthModule,
    PortfolioModule,
  ],
})
export class AppModule {}