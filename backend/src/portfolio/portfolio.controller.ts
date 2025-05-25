import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':userWallet')
  async getPortfolio(@Param('userWallet') userWallet: string) {
    try {
      return await this.portfolioService.getPortfolio(userWallet);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}