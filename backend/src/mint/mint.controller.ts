import { Controller, Post, Body, HttpException, HttpStatus, Headers } from '@nestjs/common';
import { MintService } from './mint.service';
import { JwtService } from '@nestjs/jwt';

class MintTokenDto {
  cohortId: string;
  sport: string;
  initialSupply: number;
}

@Controller('mint')
export class MintController {
  constructor(
    private readonly mintService: MintService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('token')
  async mintToken(
    @Headers('authorization') authHeader: string,
    @Body() mintTokenDto: MintTokenDto,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token);
      if (payload.role !== 'admin') {
        throw new HttpException('Forbidden: Admin access required', HttpStatus.FORBIDDEN);
      }

      const result = await this.mintService.mintToken(mintTokenDto);
      return { message: 'Token minted successfully', ...result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}