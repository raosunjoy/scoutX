import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { Trade, TradeSchema } from '../trade/trade.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Trade', schema: TradeSchema }])],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}