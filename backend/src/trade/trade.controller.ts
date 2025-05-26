import { Controller, Post, Body } from '@nestjs/common';
import { TradeService } from './trade.service';

@Controller('trade')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Post()
  async tradeToken(
    @Body('userWallet') userWallet: string,
    @Body('cohortId') cohortId: string,
    @Body('amount') amount: number,
    @Body('price') price: number,
    @Body('type') type: 'buy' | 'sell',
  ) {
    const tradeTokenDto = { userWallet, cohortId, amount, price, type };
    const result = await this.tradeService.tradeToken(
      tradeTokenDto.userWallet,
      tradeTokenDto.cohortId,
      tradeTokenDto.amount,
      tradeTokenDto.price,
      tradeTokenDto.type,
    );
    return result;
  }
}