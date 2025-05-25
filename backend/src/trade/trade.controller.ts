import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TradeService } from './trade.service';

class TradeTokenDto {
  userWallet: string;
  cohortId: string;
  amount: number;
  price: number;
  type: string; // 'buy' or 'sell'
}

@Controller('trade')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Post('token')
  async tradeToken(@Body() tradeTokenDto: TradeTokenDto) {
    try {
      const result = await this.tradeService.executeTrade(tradeTokenDto);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}