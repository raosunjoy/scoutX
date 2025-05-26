import { Controller, Post, Body } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MintService } from './mint.service';
import { MintTokenDto } from './dto/mint-token.dto';

@Controller('mint')
export class MintController {
  constructor(
    private readonly mintService: MintService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  async mintToken(@Body() mintTokenDto: MintTokenDto) {
    const { userWallet, cohortId, amount } = mintTokenDto;

    const token = this.jwtService.sign({ userWallet, cohortId, amount });
    const result = await this.mintService.mintToken(userWallet, cohortId, amount);

    return { ...result, token };
  }
}